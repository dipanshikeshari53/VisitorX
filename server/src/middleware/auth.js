import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export async function requireAdmin(req, res, next) {
  try {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Please sign in to view visitor records.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(payload.sub).select('_id name email');
    if (!admin) return res.status(401).json({ message: 'Your session is no longer valid.' });
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
  }
}
