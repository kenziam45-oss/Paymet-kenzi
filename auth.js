import crypto from 'crypto';

const SECRET = process.env.ADMIN_PASSWORD || 'fallback';

export function makeToken() {
  const payload = `admin.${Date.now()}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyToken(token) {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split('.');
    if (parts.length !== 3) return false;
    const [role, ts, sig] = parts;
    const payload = `${role}.${ts}`;
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (sig !== expected) return false;
    if (Date.now() - Number(ts) > 12 * 60 * 60 * 1000) return false;
    return role === 'admin';
  } catch {
    return false;
  }
}

export function getTokenFromReq(req) {
  const a = req.headers.authorization || '';
  return a.startsWith('Bearer ') ? a.slice(7) : null;
}

export function newId(prefix = '') {
  return prefix + crypto.randomBytes(8).toString('hex');
}