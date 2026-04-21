export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, title, location, reporter, department, urgency } = req.body;

  const urgencyLabel = { 
    low: 'ปกติ', 
    medium: '🔶 เร่งด่วน', 
    high: '🔴 ฉุกเฉิน' 
  };

  const message = `🔧 แจ้งซ่อมใหม่!\n━━━━━━━━━━━━\n📌 ${title}\n📍 ${location}\n👤 ${reporter} (${department})\n⚡ ${urgencyLabel[urgency] || urgency}\n🎫 ${id}`;

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
    },
    body: JSON.stringify({
      to: process.env.LINE_USER_ID,
      messages: [{ type: 'text', text: message }],
    }),
  });

  res.status(200).json({ ok: true });
}
