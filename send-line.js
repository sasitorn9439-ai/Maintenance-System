// /api/send-line.js
// Vercel Serverless Function — ส่ง LINE Messaging API เมื่อมีการแจ้งซ่อมใหม่

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;
  const LINE_USER_ID = process.env.LINE_USER_ID;

  if (!LINE_TOKEN || !LINE_USER_ID) {
    console.error('LINE env vars not set');
    return res.status(500).json({ error: 'LINE not configured' });
  }

  try {
    const { id, title, location, reporter, department, urgency } = req.body;

    const urgencyMap = {
      low:    '🟢 ปกติ',
      medium: '🟡 เร่งด่วน',
      high:   '🔴 ฉุกเฉิน',
    };

    const message = {
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
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: '🔧', size: 'xl', flex: 0 },
            {
              type: 'text',
              text: 'แจ้งซ่อมใหม่',
              weight: 'bold',
              size: 'lg',
              color: '#ffffff',
              margin: 'md',
              flex: 1,
            },
          ],
          paddingAll: '16px',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          paddingAll: '16px',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '📋 เลขที่', size: 'sm', color: '#8b93b0', flex: 2 },
                { type: 'text', text: id, size: 'sm', color: '#4f8ef7', flex: 3, weight: 'bold' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '📝 หัวข้อ', size: 'sm', color: '#8b93b0', flex: 2 },
                { type: 'text', text: title, size: 'sm', color: '#e8eaf2', flex: 3, wrap: true },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '📍 สถานที่', size: 'sm', color: '#8b93b0', flex: 2 },
                { type: 'text', text: location, size: 'sm', color: '#e8eaf2', flex: 3 },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '👤 ผู้แจ้ง', size: 'sm', color: '#8b93b0', flex: 2 },
                { type: 'text', text: reporter, size: 'sm', color: '#e8eaf2', flex: 3 },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '🏢 แผนก', size: 'sm', color: '#8b93b0', flex: 2 },
                { type: 'text', text: department, size: 'sm', color: '#e8eaf2', flex: 3 },
              ],
            },
            {
              type: 'separator',
              margin: 'md',
              color: '#2a3350',
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: '⚡ ความเร่งด่วน', size: 'sm', color: '#8b93b0', flex: 2 },
                {
                  type: 'text',
                  text: urgencyMap[urgency] || urgency,
                  size: 'sm',
                  color: urgency === 'high' ? '#f05a5a' : urgency === 'medium' ? '#f0a500' : '#22c98e',
                  flex: 3,
                  weight: 'bold',
                },
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '12px',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '🔍 ดูรายละเอียด',
                uri: 'https://maintenance-system-lac.vercel.app',
              },
              style: 'primary',
              color: '#4f8ef7',
              height: 'sm',
            },
          ],
        },
      },
    };

    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LINE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: LINE_USER_ID,
        messages: [message],
      }),
    });

    const lineData = await lineRes.json();

    if (!lineRes.ok) {
      console.error('LINE API error:', lineData);
      return res.status(502).json({ error: 'LINE API failed', detail: lineData });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-line error:', err);
    return res.status(500).json({ error: err.message });
  }
}
