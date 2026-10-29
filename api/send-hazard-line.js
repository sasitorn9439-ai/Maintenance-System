// LINE alert for EHS Portal hazard / near-miss reports (/api/send-hazard-line)
// Same LINE channel and card style as the maintenance and permit alerts.
// Optional: set HZ_LINE_TO in Vercel env to send hazard alerts to a different user/group than LINE_USER_ID.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = process.env.LINE_CHANNEL_TOKEN;
  const to = process.env.HZ_LINE_TO || process.env.LINE_USER_ID;
  if (!token || !to) return res.status(200).json({ ok: false, reason: 'LINE not configured' });

  const b = req.body || {};
  const s = v => String(v ?? '').trim().slice(0, 300) || '-';
  const risk = ['low', 'med', 'high'].includes(b.risk) ? b.risk : 'low';
  const head = { high: '#7f1d1d', med: '#78350f', low: '#14532d' }[risk];
  const pillFg = { high: '#f87171', med: '#fbbf24', low: '#4ade80' }[risk];
  const pillBg = { high: '#450a0a', med: '#451a03', low: '#052e16' }[risk];
  const now = new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const row = (icon, label, value) => ({
    type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
      { type: 'text', text: icon, size: 'sm', flex: 0 },
      { type: 'text', text: label, size: 'sm', color: '#6b7fa3', flex: 2 },
      { type: 'text', text: s(value), size: 'sm', color: '#e2e8f0', flex: 4, wrap: true, align: 'end' },
    ],
  });

  const messages = [];
  if (/^https:\/\//.test(b.imageUrl || '')) {
    messages.push({ type: 'image', originalContentUrl: b.imageUrl, previewImageUrl: b.imageUrl });
  }
  messages.push({
    type: 'flex',
    altText: `⚠️ แจ้งจุดเสี่ยง (${s(b.riskTh)}): ${s(b.title)} [${s(b.no)}]`,
    contents: {
      type: 'bubble',
      styles: { header: { backgroundColor: head }, body: { backgroundColor: '#111827' }, footer: { backgroundColor: '#0f172a' } },
      header: {
        type: 'box', layout: 'horizontal', paddingAll: '14px', spacing: 'md', alignItems: 'center',
        contents: [
          { type: 'text', text: '⚠️', size: 'xl', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'แจ้งจุดเสี่ยงใหม่', weight: 'bold', size: 'lg', color: '#ffffff' },
            { type: 'text', text: now, size: 'xxs', color: '#fde7d9' },
          ]},
          { type: 'box', layout: 'vertical', flex: 0, backgroundColor: pillBg, cornerRadius: '20px', paddingAll: '6px', paddingStart: '10px', paddingEnd: '10px',
            contents: [{ type: 'text', text: `เสี่ยง${s(b.riskTh)}`, size: 'xs', color: pillFg, weight: 'bold' }] },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'md',
        contents: [
          { type: 'text', text: s(b.title), weight: 'bold', size: 'md', color: '#ffffff', wrap: true, maxLines: 4 },
          { type: 'text', text: `${s(b.type)} · ${s(b.cat)}`, size: 'xs', color: '#94a3b8', wrap: true },
          { type: 'separator', color: '#1e2d4a' },
          { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
            row('📍', 'สถานที่', b.location),
            row('👤', 'ผู้แจ้ง', b.reporter),
            row('🕒', 'พบเมื่อ', b.when),
          ]},
          { type: 'separator', color: '#1e2d4a' },
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '🎫', size: 'xs', flex: 0 },
            { type: 'text', text: s(b.no), size: 'xs', color: '#4f8ef7', flex: 1, weight: 'bold' },
            { type: 'text', text: 'รอ EHS ดำเนินการ', size: 'xs', color: '#fbbf24', flex: 0, weight: 'bold' },
          ]},
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [{
          type: 'button', style: 'primary', color: '#2563eb', height: 'sm',
          action: { type: 'uri', label: 'ดูรายละเอียด →', uri: /^https:\/\//.test(b.url || '') ? b.url : 'https://maintenance-system-lac.vercel.app/ehs.html#hz' },
        }],
      },
    },
  });

  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages }),
  });
  const text = await r.text();
  return res.status(200).json({ ok: r.ok, status: r.status, detail: r.ok ? undefined : text.slice(0, 300) });
}
