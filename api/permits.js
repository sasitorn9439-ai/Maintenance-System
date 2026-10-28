// Read-only Permit to Work feed for external systems (e.g. mcam.asia Work Permit System)
// GET /api/permits?status=active|pending|closed|all&since=2026-10-01&limit=100
// Header: x-api-key: <PTW_API_KEY>   (required when PTW_API_KEY is set in Vercel env)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qxokalkgvethzgehmdaz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4b2thbGtndmV0aHpnZWhtZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTc2NDgsImV4cCI6MjA5MDc3MzY0OH0.0bcK4J0JgQufzp38kfyo3oGupQSfsYQ7tKfaCDMlUiU';
const TYPES = {
  daily: ['DW', 'Daily Work Permit for External Contractors', 'ใบอนุญาตปฏิบัติงานประจำวัน', '14-2046-TH'],
  hot:   ['HW', 'Hot Work Permit', 'ใบขออนุญาตงานที่มีความร้อนและประกายไฟ', '14-2045-TH'],
  wah:   ['WAH', 'Work at Height Permit', 'ใบขออนุญาตปฏิบัติงานบนที่สูง', '14-2044-TH'],
  loto:  ['LOTO', 'Lock Out and Tag Out Permit', 'ใบขออนุญาตล็อกและแขวนป้าย', '14-2043-TH'],
  cs:    ['CS', 'Confined Space Entry Permit', 'ใบอนุญาตทำงานในที่อับอากาศ', ''],
};
const STATUS = { active: 'approved,closing', pending: 'pending', closed: 'closed', all: '' };

export default async function handler(req, res) {
  const origin = process.env.PTW_ALLOWED_ORIGIN || 'https://mcam.asia';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (process.env.PTW_API_KEY && req.headers['x-api-key'] !== process.env.PTW_API_KEY)
    return res.status(401).json({ error: 'invalid_api_key' });

  const q = req.query || {};
  const st = STATUS[q.status] ?? STATUS.active;
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 100, 1), 500);
  const params = new URLSearchParams({ select: '*', order: 'start_at.desc', limit: String(limit) });
  if (st) params.append('status', `in.(${st})`);
  if (q.since && !isNaN(Date.parse(q.since))) params.append('start_at', `gte.${new Date(q.since).toISOString()}`);

  const r = await fetch(`${SUPABASE_URL}/rest/v1/ehs_permits?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) return res.status(502).json({ error: 'upstream_error', status: r.status });
  const rows = await r.json();

  const host = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  const permits = rows.map(p => {
    const t = TYPES[p.type] || ['PTW', p.type, p.type, ''];
    const d = p.data || {}, a = p.approval || {}, c = p.closure || {};
    return {
      permit_no: `${t[0]}-${new Date(p.created_at).getFullYear()}-${String(p.seq || 0).padStart(4, '0')}`,
      id: p.id,
      type: p.type, type_code: t[0], type_name_en: t[1], type_name_th: t[2], form_no: t[3],
      status: p.status, // pending | approved | closing | closed | rejected | cancelled
      area: p.area || '', location: d.loc || '', description: d.desc || '',
      company: d.company || '', requester: d.requester || '', requester_tel: d.tel || '',
      supervisor: d.supervisor || '', workers: Number(d.workers) || null, ref_jsea: d.ref || '',
      start_at: p.start_at, end_at: p.end_at,
      expired: p.status === 'approved' && p.end_at ? new Date(p.end_at) < new Date() : false,
      approved_by: a.approver || null, area_owner: a.owner || null, approved_at: a.at || null,
      closed_by: c.approver || null, closed_at: c.closedAt || null,
      photos: (d.photos || []).map(x => ({ url: x.url, taken_at: x.taken_at })),
      created_at: p.created_at, updated_at: p.updated_at,
      view_url: `${host}/ehs.html#ptw`,
    };
  });
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  res.status(200).json({ count: permits.length, generated_at: new Date().toISOString(), permits });
}
