import jwt from 'jsonwebtoken';

// In a real deployment this would come from a secret manager. For a local
// hackathon build we read it from .env and fall back to a dev default.
const JWT_SECRET = process.env.JWT_SECRET || 'dayflow-dev-secret-change-me';
const TOKEN_TTL = '7d';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, code: user.employee_code, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

// Verifies the Bearer token and attaches req.user. Blocks anonymous access.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'You need to be logged in.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// Gatekeeps admin/HR-only routes.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admins only.' });
  }
  next();
}
