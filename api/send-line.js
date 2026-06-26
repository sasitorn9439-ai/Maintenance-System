export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, title, location, reporter, department, urgency, imageUrl } = req.body;

  const urgencyLabel = {
    low:    '🟢 ปกติ',
    medium: '🟡 เร่งด่วน',
    high:   '🔴 ฉุกเฉิน',
  };

  const urgencyColor = {
    low:    '#22c98e',
    medium: '#f0a500',
    high:   '#f05a5a',
  };

  // Build Flex Message
  const bodyContents = [
    { type: 'text', text: title, weight: 'bold', size: 'md', color: '#ffffff', wrap: true, margin: 'none' },
    { type: 'separator', margin: 'md', color: '#2a3350' },
    {
      type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
      contents: [
        {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: '📍', size: 'sm', flex: 0 },
            { type: 'text', text: location, size: 'sm', color: '#c8cce0', flex: 1, margin: 'sm', wrap: true },
          ],
        },
        {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: '👤', size: 'sm', flex: 0 },
            { type: 'text', text: `${reporter} · ${department}`, size: 'sm', color: '#c8cce0', flex: 1, margin: 'sm', wrap: true },
          ],
        },
        {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: '⚡', size: 'sm', flex: 0 },
            { type: 'text', text: urgencyLabel[urgency] || urgency, size: 'sm', color: urgencyColor[urgency] || '#ffffff', flex: 1, margin: 'sm', weight: 'bold' },
          ],
        },
        {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: '🎫', size: 'sm', flex: 0 },
            { type: 'text', text: id, size: 'sm', color: '#4f8ef7', flex: 1, margin: 'sm', weight: 'bold' },
          ],
        },
      ],
    },
  ];

  // ถ้ามีรูป → เพิ่ม image block
  if (imageUrl) {
    bodyContents.push({ type: 'separator', margin: 'md', color: '#2a3350' });
    bodyContents.push({
      type: 'image',
      url: imageUrl,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
      margin: 'md',
      action: { type: 'uri', uri: imageUrl },
    });
  }

  const flexMessage = {
    type: 'flex',
    altText: `🔧 แจ้งซ่อมใหม่: ${title}`,
    contents: {
      type: 'bubble',
      styles: {
        header: { backgroundColor: '#1a237e' },
        body:   { backgroundColor: '#0c0f1a' },
        footer: { backgroundColor: '#0c0f1a' },
      },
      header: {
        type: 'box', layout: 'horizontal', paddingAll: '16px',
        contents: [
          { type: 'text', text: '🔧', size: 'xl', flex: 0 },
          { type: 'text', text: 'แจ้งซ่อมใหม่', weight: 'bold', size: 'lg', color: '#ffffff', margin: 'md', flex: 1 },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '16px',
        contents: bodyContents,
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '🔍 ดูรายละเอียด', uri: 'https://maintenance-system-lac.vercel.app' },
            style: 'primary', color: '#4f8ef7', height: 'sm',
          },
        ],
      },
    },
  };

  const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: process.env.LINE_USER_ID,
      messages: [flexMessage],
    }),
  });

  const lineData = await lineRes.json();
  res.status(200).json({ ok: lineRes.ok, status: lineRes.status, line: lineData });
}
