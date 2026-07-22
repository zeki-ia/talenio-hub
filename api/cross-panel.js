/**
 * GET /api/cross-panel?company_id=XXX
 * Returns 12-month correlation data for companies with both Climia + Nomia:
 *   - climia: monthly clima score (0-100) + response count
 *   - nomia:  monthly headcount + real cost if available
 */

import { createClient } from '@supabase/supabase-js';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const SCALE_MAX = 5;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: 'Supabase env missing' });

  // Auth: must be logged-in user — validate JWT
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No auth' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify token by getting the user
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  // Get company_id — from query or from user row
  let companyId = req.query.company_id;
  if (!companyId) {
    const { data: u } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle();
    companyId = u?.company_id;
  }
  if (!companyId) return res.status(400).json({ error: 'No company_id' });

  const now = new Date();
  const currentYear = now.getFullYear();
  const yearParam = parseInt(req.query.year, 10);
  const year = (yearParam >= 2020 && yearParam <= currentYear) ? yearParam : currentYear;
  const isCurrentYear = year === currentYear;

  // ── Climia data ──────────────────────────────────────────────────────────────

  // Find climia client for this company
  const { data: climiaClient } = await supabase
    .from('climia_clients')
    .select('id, name')
    .eq('company_id', companyId)
    .maybeSingle();

  const climiaData = {};
  if (climiaClient) {
    // Fetch all responses for current + previous year
    const { data: responses } = await supabase
      .from('climia_responses')
      .select('month, answers, enps')
      .eq('client_id', climiaClient.id)
      .gte('month', `${year}-01`)
      .lte('month', `${year}-12`);

    for (const row of responses || []) {
      const [y, m] = row.month.split('-');
      const key = `${y}-${m}`;
      if (!climiaData[key]) climiaData[key] = { sum: 0, cnt: 0, respCount: 0, enpsVals: [] };
      for (const v of Object.values(row.answers || {})) {
        if (typeof v === 'number') { climiaData[key].sum += v; climiaData[key].cnt++; }
      }
      if (typeof row.enps === 'number') climiaData[key].enpsVals.push(row.enps);
      climiaData[key].respCount++;
    }
  }

  // ── Nomia data ───────────────────────────────────────────────────────────────

  // Find nomia cliente via perfiles
  const { data: perfiles } = await supabase
    .from('nomia_perfiles')
    .select('cliente_id')
    .eq('company_id', companyId)
    .limit(1);

  const nomiaClienteId = perfiles?.[0]?.cliente_id;
  const nomiaData = {};

  if (nomiaClienteId) {
    // Headcount: from nomia_empleados.meses_activo (array of 12, value 1 = active)
    const { data: empleados } = await supabase
      .from('nomia_empleados')
      .select('meses_activo')
      .eq('cliente_id', nomiaClienteId);

    // Headcount from meses_activo only applies to the current year
    for (let m = 0; m < 12; m++) {
      const key = `${year}-${String(m + 1).padStart(2, '0')}`;
      const count = isCurrentYear
        ? (empleados || []).filter(e => (e.meses_activo?.[m] ?? 1) === 1).length
        : null;
      nomiaData[key] = { headcount: count, realCost: null };
    }

    // Real costs: filtered to the selected year
    const { data: costos } = await supabase
      .from('nomia_costos_reales')
      .select('anio, mes, monto')
      .eq('cliente_id', nomiaClienteId)
      .eq('centro_costo', 'TOTAL')
      .eq('anio', year);

    for (const c of costos || []) {
      const key = `${c.anio}-${String(c.mes).padStart(2, '0')}`;
      if (!nomiaData[key]) nomiaData[key] = { headcount: null, realCost: null };
      nomiaData[key].realCost = Number(c.monto);
    }
  }

  // ── Build 12-month series (current year) ─────────────────────────────────────

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const key = `${year}-${m}`;

    const cRow = climiaData[key];
    const nRow = nomiaData[key];

    const climaScore = cRow?.cnt
      ? Math.round((cRow.sum / cRow.cnt / SCALE_MAX) * 1000) / 10
      : null;
    const enpsVals = cRow?.enpsVals || [];
    const enps = enpsVals.length
      ? Math.round(enpsVals.filter(v => v >= 9).length / enpsVals.length * 100)
        - Math.round(enpsVals.filter(v => v <= 6).length / enpsVals.length * 100)
      : null;

    return {
      mes: MONTHS[i],
      mesNum: i + 1,
      climaScore,
      enps,
      respCount: cRow?.respCount || 0,
      headcount: nRow?.headcount ?? null,
      realCost: nRow?.realCost ?? null,
    };
  });

  // Summary stats
  const climaMeses = months.filter(m => m.climaScore !== null);
  const climaAvg = climaMeses.length
    ? Math.round(climaMeses.reduce((s, m) => s + m.climaScore, 0) / climaMeses.length * 10) / 10
    : null;

  const headcounts = months.filter(m => m.headcount !== null).map(m => m.headcount);
  const headcountDelta = headcounts.length >= 2
    ? headcounts[headcounts.length - 1] - headcounts[0]
    : null;

  return res.status(200).json({
    ok: true,
    companyId,
    year,
    isCurrentYear,
    climiaClientName: climiaClient?.name || null,
    hasClimia: !!climiaClient,
    hasNomia: !!nomiaClienteId,
    climaAvg,
    headcountDelta,
    months,
  });
}
