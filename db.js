import { kv } from '@vercel/kv';

export async function createOrder(o) {
  await kv.set(`order:${o.id}`, o, { ex: 172800 });
  await kv.lpush('orders:all', o.id);
  await kv.ltrim('orders:all', 0, 199);
  return o;
}

export async function getOrder(id) {
  if (!id) return null;
  const o = await kv.get(`order:${id}`);
  return o || null;
}

export async function updateOrder(id, patch) {
  const o = await getOrder(id);
  if (!o) return null;
  const u = { ...o, ...patch };
  await kv.set(`order:${id}`, u, { ex: 172800 });
  return u;
}

export async function listOrders(limit = 100) {
  const ids = await kv.lrange('orders:all', 0, limit - 1);
  const out = [];
  for (const id of ids) {
    const o = await getOrder(id);
    if (o) out.push(o);
  }
  return out;
}