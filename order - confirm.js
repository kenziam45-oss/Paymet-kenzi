import { getOrder, updateOrder } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const { order_id, dana_number } = req.body || {};
    if (!order_id || !dana_number)
      return res.status(400).json({ error: 'order_id dan dana_number wajib' });

    const clean = String(dana_number).replace(/\D/g, '');
    if (!/^0?8\d{8,13}$/.test(clean))
      return res.status(400).json({ error: 'format nomor DANA tidak valid (contoh: 085812345678)' });

    const o = await getOrder(order_id);
    if (!o) return res.status(404).json({ error: 'order tidak ditemukan' });
    if (o.status !== 'created')
      return res.status(400).json({ error: 'order sudah diproses sebelumnya' });

    const updated = await updateOrder(order_id, {
      status: 'proses',
      dana_number: clean,
      confirmed_at: Date.now()
    });
    return res.json({ order: updated });
  } catch (e) {
    console.error('order-confirm error:', e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
}