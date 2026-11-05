import { getOrder, updateOrder } from '../lib/db.js';
import { getTokenFromReq, verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const token = getTokenFromReq(req);
    if (!verifyToken(token)) return res.status(401).json({ error: 'unauthorized' });

    const { order_id, action } = req.body || {};
    if (!order_id || !action)
      return res.status(400).json({ error: 'order_id dan action wajib' });

    const o = await getOrder(order_id);
    if (!o) return res.status(404).json({ error: 'order tidak ditemukan' });
    if (o.status !== 'proses')
      return res.status(400).json({ error: 'order bukan dalam status proses' });

    if (action === 'sukses') {
      const u = await updateOrder(order_id, { status: 'sukses', sukses_at: Date.now() });
      return res.json({ order: u });
    }
    if (action === 'tolak') {
      const u = await updateOrder(order_id, { status: 'batal', rejected_at: Date.now() });
      return res.json({ order: u });
    }
    return res.status(400).json({ error: 'action harus sukses atau tolak' });
  } catch (e) {
    console.error('admin-approve error:', e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
}