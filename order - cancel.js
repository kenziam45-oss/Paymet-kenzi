import { getOrder, updateOrder } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const { order_id } = req.body || {};
    if (!order_id) return res.status(400).json({ error: 'order_id wajib' });
    const o = await getOrder(order_id);
    if (!o) return res.status(404).json({ error: 'order tidak ditemukan' });
    if (o.status !== 'created')
      return res.status(400).json({ error: 'order tidak bisa dibatalkan' });
    const updated = await updateOrder(order_id, { status: 'batal', cancelled_at: Date.now() });
    return res.json({ order: updated });
  } catch (e) {
    console.error('order-cancel error:', e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
}