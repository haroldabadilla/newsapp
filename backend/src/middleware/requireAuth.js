import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  const user = await User.findById(req.session.userId).select('_id name email').lean();
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid session' } });
  }

  // Attach a normalized user object
  req.user = { id: String(user._id), name: user.name, email: user.email };
  next();
}