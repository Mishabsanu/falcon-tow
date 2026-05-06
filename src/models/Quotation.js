import mongoose from 'mongoose';

const QuotationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  
  pickup: { type: String },
  dropoff: { type: String },
  
  driver: { type: String },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  vehicle: { type: String },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  
  date: { type: Date },
  amount: { type: Number },
  status: { type: String, enum: ['Draft', 'Sent', 'Approved', 'Cancelled', 'Rejected'], default: 'Draft' },
  
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);
