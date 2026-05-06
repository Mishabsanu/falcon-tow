import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  
  jobId: { type: String },
  towId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tow' },
  
  customer: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  
  worker: { type: String },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  vehicle: { type: String },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  
  type: { type: String, enum: ['Cash', 'Card', 'Bank Transfer', 'Credit'], default: 'Credit' },
  total: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
  
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
