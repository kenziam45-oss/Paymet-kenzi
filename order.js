import { createOrder, getOrder } from '../lib/db.js';
import { newId } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      const { nama, amount, description } = req.body || {};
      if (!nama || !amount) return res.status(400).json({ error: 'nama dan amount wajib' });
      const amt = Number(amount);
      if (!amt || amt < 1000) return res.status(400).json({ error: 'minimal Rp1.000' });
      const o = {
        id: newId('ORD-'),
        nama: String(nama).trim(),
        amount: amt,
        description: (description || 'Pembayaran').trim(),
        status: 'created',
        dana_number: null,
        created_at: Date.now()
      };
      await createOrder(o);
      return res.json({ order: o });
    }

    if (req.method === 'GET') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id wajib' });
      const o = await getOrder(id);
      if (!o) return res.status(404).json({ error: 'order tidak ditemukan' });
      return res.json({ order: o });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('order error:', e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
}