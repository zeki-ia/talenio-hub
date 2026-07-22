/**
 * GET /api/cross-alerts
 * Admin-only. Scans all companies that have both Climia + Nomia active
 * subscriptions and returns those with health alerts:
 *   - climaAvg < CLIMA_THRESHOLD (default 60)
 *   - latest eNPS < ENPS_THRESHOLD (default 20)
 *   - both simultaneously (critical)
 */

import { createClient } from '@supabase/supabase-js';

const CLIMA_THRESHOLD = 60;
const ENPS_THRESHOLD  = 20;
const SCALE_MAX       = 5;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: 'Supabase env missing' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No auth' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  // Only Delenio admins
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (userRow?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const now  = new Date();
  const year = now.getFullYear();

  // Companies with both climia + nomia active subs
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('company_id, product')
    .eq('status', 'active')
    .in('product', ['climia', 'nomia']);

  const byCompany = {};
  for (const s of subs || []) {
    if (!byCompany[s.company_id]) byCompany[s.company_id] = new Set();
    byCompany[s.company_id].add(s.product);
  }
  const dualCompanyIds = Object.entries(byCompany)
    .filter(([, prods]) => prods.has('climia') && prods.has('nomia'))
    .map(([id]) => id);

  if (!dualCompanyIds.length) return res.status(200).json({ ok: true, alerts: [] });

  // Company names
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .in('id', dualCompanyIds);

  const nameOf = Object.fromEntries((companies || []).map(c => [c.id, c.name]));

  // Climia clients for these companies
  const { data: climiaClients } = await supabase
    .from('climia_clients')
    .select('id, company_id')
    .in('company_id', dualCompanyIds);

  const climiaClientByCompany = Object.fromEntries(
    (climiaClients || []).map(c => [c.company_id, c.id])
  );

  // Fetch climia responses for all relevant clients
  const climiaClientIds = climiaClients?.map(c => c.id) || [];
  const { data: responses } = climiaClientIds.length
    ? await supabase
        .from('climia_responses')
        .select('client_id, month, answers, enps')
        .in('client_id', climiaClientIds)
        .gte('month', `${year - 1}-01`)
    : { data: [] };

  // Aggregate per (company, month)
  const climiaByCompany = {};
  for (const row of responses || []) {
    const companyId = climiaClients.find(c => c.id === row.client_id)?.company_id;
    if (!companyId) continue;
    const [y, m] = row.month.split('-');
    const key = `${y}-${m}`;
    if (!climiaByCompany[companyId]) climiaByCompany[companyId] = {};
    if (!climiaByCompany[companyId][key]) climiaByCompany[companyId][key] = { sum: 0, cnt: 0, enpsVals: [] };
    for (const v of Object.values(row.answers || {})) {
      if (typeof v === 'number') { climiaByCompany[companyId][key].sum += v; climiaByCompany[companyId][key].cnt++; }
    }
    if (typeof row.enps === 'number') climiaByCompany[companyId][key].enpsVals.push(row.enps);
  }

  const alerts = [];

  for (const companyId of dualCompanyIds) {
    const data = climiaByCompany[companyId] || {};

    // Compute climaAvg across all months with data
    let totalSum = 0, totalCnt = 0;
    const monthlyScores = [];
    const enpsLatest = [];

    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      const row = data[key];
      if (row?.cnt) {
        const score = (row.sum / row.cnt / SCALE_MAX) * 100;
        totalSum += score;
        totalCnt++;
        monthlyScores.push({ m, score });
        if (row.enpsVals.length) {
          const enps = Math.round(row.enpsVals.filter(v => v >= 9).length / row.enpsVals.length * 100)
            - Math.round(row.enpsVals.filter(v => v <= 6).length / row.enpsVals.length * 100);
          enpsLatest.push(enps);
        }
      }
    }

    if (!totalCnt) continue; // no data, skip

    const climaAvg  = Math.round(totalSum / totalCnt * 10) / 10;
    const latestEnps = enpsLatest.length ? enpsLatest[enpsLatest.length - 1] : null;

    const companyAlerts = [];

    if (climaAvg < CLIMA_THRESHOLD) {
      companyAlerts.push({
        type: 'clima',
        level: climaAvg < 40 ? 'error' : 'warn',
        message: `Clima ${climaAvg}% (umbral: ${CLIMA_THRESHOLD}%)`,
      });
    }

    if (latestEnps !== null && latestEnps < ENPS_THRESHOLD) {
      companyAlerts.push({
        type: 'enps',
        level: latestEnps < 0 ? 'error' : 'warn',
        message: `eNPS ${latestEnps > 0 ? '+' : ''}${latestEnps} (umbral: ${ENPS_THRESHOLD})`,
      });
    }

    if (companyAlerts.length) {
      const isCritical = companyAlerts.length >= 2 ||
        companyAlerts.some(a => a.level === 'error');

      alerts.push({
        companyId,
        companyName: nameOf[companyId] || companyId,
        climaAvg,
        latestEnps,
        isCritical,
        alerts: companyAlerts,
      });
    }
  }

  // Sort: critical first
  alerts.sort((a, b) => (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0));

  return res.status(200).json({ ok: true, alerts });
}
