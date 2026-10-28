// LINE alert for EHS Portal permit requests (/api/send-ptw-line)
// Uses the same LINE channel as the maintenance system.
// Optional: set PTW_LINE_TO in Vercel env to send permit alerts to a different user/group than LINE_USER_ID.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = process.env.LINE_CHANNEL_TOKEN;
  const to = process.env.PTW_LINE_TO || process.env.LINE_USER_ID;
  if (!token || !to) return res.status(200).json({ ok: false, reason: 'LINE not configured' });

  const b = req.body || {};
  const s = v => String(v ?? '').slice(0, 300) || '-';
  const isClose = b.kind === 'close';
  const head = isClose ? '✅ ขอปิดใบอนุญาต' : '📝 ขอใบอนุญาตทำงานใหม่';
  const color = isClose ? '#1e7a4c' : '#9a3412';
  const row = (label, value) => ({
    type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
      { type: 'text', text: label, size: 'sm', color: '#6b7280', flex: 2 },
      { type: 'text', text: s(value), size: 'sm', color: '#111827', flex: 5, wrap: true },
    ],
  });

  const contents = {
    type: 'bubble',
    header: { type: 'box', layout: 'vertical', backgroundColor: color, paddingAll: '14px', contents: [
      { type: 'text', text: head, weight: 'bold', size: 'md', color: '#ffffff' },
      { type: 'text', text: `${s(b.no)} · ${s(b.typeTh)}`, size: 'xs', color: '#ffffffcc', wrap: true, margin: 'xs' },
    ]},
    body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px', contents: [
      { type: 'text', text: s(b.title), weight: 'bold', size: 'md', wrap: true },
      { type: 'separator', margin: 'md' },
      row('พื้นที่', b.location), row('ผู้ขอ', b.requester), row('บริษัท', b.company),
      row('เริ่ม', b.start), row('สิ้นสุด', b.end),
    ]},
  };
  if (/^https:\/\//.test(b.url || '')) {
    contents.footer = { type: 'box', layout: 'vertical', contents: [
      { type: 'button', style: 'primary', color, height: 'sm', action: { type: 'uri', label: 'เปิดใน EHS Portal', uri: b.url } },
    ]};
  }

  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: [{ type: 'flex', altText: `${head}: ${s(b.no)} ${s(b.title)}`, contents }] }),
  });
  res.status(200).json({ ok: r.ok, status: r.status });
}
