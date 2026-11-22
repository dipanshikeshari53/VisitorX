import { Router } from 'express';
import Visitor from '../models/Visitor.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const purposes = ['Meeting a staff member', 'Attending an event', 'Academic enquiry', 'Campus tour', 'College work / delivery'];

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const host = String(req.body.host || '').trim();
    let purpose = String(req.body.purpose || '').trim();
    if (purpose === 'Other') purpose = `Other: ${String(req.body.otherPurpose || '').trim()}`;
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Enter a name between 2 and 80 characters.' });
    if (!/^[+0-9() .-]{7,18}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid mobile number.' });
    if (host.length > 100) return res.status(400).json({ message: 'Host or department must be 100 characters or fewer.' });
    if (purpose.length > 120 || !purpose) return res.status(400).json({ message: 'Select a purpose for your visit.' });
    if (!purposes.includes(purpose) && !purpose.startsWith('Other: ')) return res.status(400).json({ message: 'Choose one of the listed visit purposes.' });
    if (purpose === 'Other: ') return res.status(400).json({ message: 'Please describe your purpose of visit.' });
    const visitor = await Visitor.create({ name, phone, host, purpose });
    res.status(201).json({ visitor: { id: visitor.id, name: visitor.name, checkIn: visitor.checkIn } });
  } catch (error) { next(error); }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { q = '', date = 'today', status = 'all' } = req.query;
    const filter = {};
    if (date === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      filter.checkIn = { $gte: start, $lt: end };
    }
    if (status === 'inside') filter.checkOut = null;
    if (status === 'completed') filter.checkOut = { $ne: null };
    const search = String(q).trim().slice(0, 100);
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['name', 'phone', 'host', 'purpose'].map((field) => ({ [field]: { $regex: safe, $options: 'i' } }));
    }
    const visitors = await Visitor.find(filter).sort({ checkIn: -1 }).limit(500).lean();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    const [todayTotal, todayInside, todayDone] = await Promise.all([
      Visitor.countDocuments({ checkIn: { $gte: todayStart, $lt: todayEnd } }),
      Visitor.countDocuments({ checkIn: { $gte: todayStart, $lt: todayEnd }, checkOut: null }),
      Visitor.countDocuments({ checkIn: { $gte: todayStart, $lt: todayEnd }, checkOut: { $ne: null } }),
    ]);
    res.json({ visitors, stats: { todayTotal, todayInside, todayDone } });
  } catch (error) { next(error); }
});

router.patch('/:id/checkout', requireAdmin, async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, { $set: { checkOut: new Date() } }, { new: true, runValidators: true });
    if (!visitor) return res.status(404).json({ message: 'Visitor record not found.' });
    res.json({ visitor });
  } catch (error) { next(error); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor record not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
