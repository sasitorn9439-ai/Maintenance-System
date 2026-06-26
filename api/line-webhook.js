// /api/line-webhook.js
// Webhook รับ event จาก LINE แล้วบันทึก User ID / Group ID

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('LINE Webhook OK');
  }

  if (req.method === 'POST') {
    const events = req.body?.events || [];

    for (const event of events) {
      const source = event.source || {};
      console.log('=== LINE EVENT ===');
      console.log('type:', source.type);
      console.log('userId:', source.userId);
      console.log('groupId:', source.groupId || '-');
      console.log('=================');
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
