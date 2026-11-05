import { listOrders } from '../lib/db.js';
import { getTokenFromReq, verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  try {
    const token = getTokenFromReq(req);
    if (!verifyToken(token)) return res.status(401).json({ error: 'unauthorized' });
    const orders = await listOrders(100);
    return res.json({ orders });
  } catch (e) {
    console.error('admin-orders error:', e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
}