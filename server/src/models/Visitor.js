import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 18 },
  host: { type: String, trim: true, maxlength: 100, default: '' },
  purpose: { type: String, required: true, trim: true, maxlength: 120 },
  checkIn: { type: Date, required: true, default: Date.now },
  checkOut: { type: Date, default: null },
}, { timestamps: true });

visitorSchema.index({ checkIn: -1 });
visitorSchema.index({ name: 'text', phone: 'text', host: 'text', purpose: 'text' });
export default mongoose.model('Visitor', visitorSchema);
