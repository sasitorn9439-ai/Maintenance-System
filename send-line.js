// /api/send-line.js
// Vercel Serverless Function — ส่ง LINE Notify เมื่อมีการแจ้งซ่อมใหม่
// วางไฟล์นี้ที่: api/send-line.js ใน root ของ repo

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const LINE_TOKEN = process.env.LINE_NOTIFY_TOKEN;
  if (!LINE_TOKEN) {
    console.error('LINE_NOTIFY_TOKEN not set');
    return res.status(500).json({ error: 'LINE token not configured' });
  }

  try {
    const { id, title, location, reporter, department, urgency } = req.body;

    const urgencyMap = {
      low:    '🟢 ปกติ',
      medium: '🟡 เร่งด่วน',
      high:   '🔴 ฉุกเฉิน',
    };

    const message = [
      '',
      '🔧 แจ้งซ่อมใหม่!',
      `━━━━━━━━━━━━━━━━━`,
      `📋 เลขที่: ${id}`,
      `📝 หัวข้อ: ${title}`,
      `📍 สถานที่: ${location}`,
      `👤 ผู้แจ้ง: ${reporter}`,
      `🏢 แผนก: ${department}`,
      `⚡ ความเร่งด่วน: ${urgencyMap[urgency] || urgency}`,
      `━━━━━━━━━━━━━━━━━`,
      `🔗 https://maintenance-system-lac.vercel.app`,
    ].join('\n');

    const params = new URLSearchParams();
    params.append('message', message);

    const lineRes = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LINE_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const lineData = await lineRes.json();

    if (!lineRes.ok) {
      console.error('LINE API error:', lineData);
      return res.status(502).json({ error: 'LINE API failed', detail: lineData });
    }

    return res.status(200).json({ ok: true, line: lineData });
  } catch (err) {
    console.error('send-line error:', err);
    return res.status(500).json({ error: err.message });
  }
}
