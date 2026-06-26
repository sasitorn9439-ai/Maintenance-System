export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, title, location, reporter, department, urgency, imageUrl } = req.body;

  const urgencyLabel = { low:'ปกติ', medium:'เร่งด่วน', high:'ฉุกเฉิน' };
  const urgencyColor = { low:'#22c98e', medium:'#f0a500', high:'#ff3b30' };
  const urgencyBg    = { low:'#0d3b2e', medium:'#3b2a00', high:'#3b0d0d' };
  const urgencyIcon  = { low:'🟢', medium:'🟡', high:'🔴' };

  const now = new Date().toLocaleString('th-TH', {
    timeZone:'Asia/Bangkok', day:'2-digit', month:'2-digit',
    year:'numeric', hour:'2-digit', minute:'2-digit',
  });

  const messages = [];

  // ── รูปภาพ (ส่งแยกก่อน Flex) ──
  if (imageUrl) {
    messages.push({
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl,
    });
  }

  // ── Flex Message ──
  messages.push({
    type: 'flex',
    altText: `🔧 แจ้งซ่อมใหม่: ${title} [${id}]`,
    contents: {
      type: 'bubble',
      styles: {
        header: { backgroundColor: '#1a237e' },
        body:   { backgroundColor: '#111827' },
        footer: { backgroundColor: '#0f172a' },
      },
      header: {
        type: 'box', layout: 'horizontal', paddingAll: '14px', spacing: 'md',
        contents: [
          { type: 'text', text: '🔧', size: 'xl', flex: 0 },
          {
            type: 'box', layout: 'vertical', flex: 1,
            contents: [
              { type: 'text', text: 'แจ้งซ่อมใหม่', weight: 'bold', size: 'lg', color: '#ffffff' },
              { type: 'text', text: now, size: 'xxs', color: '#8899bb', margin: 'xs' },
            ],
          },
          {
            type: 'box', layout: 'vertical', flex: 0, justifyContent: 'center',
            backgroundColor: urgencyBg[urgency] || '#1a237e',
            cornerRadius: '20px', paddingAll: '6px', paddingStart: '10px', paddingEnd: '10px',
            contents: [{
              type: 'text',
              text: `${urgencyIcon[urgency] || ''} ${urgencyLabel[urgency] || urgency}`,
              size: 'xxs', color: urgencyColor[urgency] || '#ffffff', weight: 'bold',
            }],
          },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'md',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'lg', color: '#ffffff', wrap: true },
          { type: 'separator', color: '#1e2d4a' },
          {
            type: 'box', layout: 'vertical', spacing: 'sm',
            contents: [
              { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
                { type: 'text', text: '📍', size: 'sm', flex: 0 },
                { type: 'text', text: 'สถานที่', size: 'sm', color: '#6b7fa3', flex: 2 },
                { type: 'text', text: location, size: 'sm', color: '#e2e8f0', flex: 3, wrap: true, align: 'end' },
              ]},
              { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
                { type: 'text', text: '👤', size: 'sm', flex: 0 },
                { type: 'text', text: 'ผู้แจ้ง', size: 'sm', color: '#6b7fa3', flex: 2 },
                { type: 'text', text: reporter, size: 'sm', color: '#e2e8f0', flex: 3, wrap: true, align: 'end' },
              ]},
              { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
                { type: 'text', text: '🏢', size: 'sm', flex: 0 },
                { type: 'text', text: 'แผนก', size: 'sm', color: '#6b7fa3', flex: 2 },
                { type: 'text', text: department, size: 'sm', color: '#e2e8f0', flex: 3, wrap: true, align: 'end' },
              ]},
            ],
          },
          { type: 'separator', color: '#1e2d4a' },
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '🎫', size: 'xs', flex: 0 },
            { type: 'text', text: id, size: 'xs', color: '#4f8ef7', flex: 1, weight: 'bold' },
          ]},
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: 'ดูรายละเอียด →', uri: 'https://maintenance-system-lac.vercel.app' },
          style: 'primary', color: '#2563eb', height: 'sm',
        }],
      },
    },
  });

  const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to: process.env.LINE_USER_ID, messages }),
  });

  const lineData = await lineRes.json();
  res.status(200).json({ ok: lineRes.ok, status: lineRes.status, line: lineData });
}
