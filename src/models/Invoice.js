import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  
  customer: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  companyName: { type: String }, // Billing Company Name
  companyNumber: { type: String }, // Billing Contact
  
  towDetails: [{
    towId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tow' },
    jobId: String, // Friendly ID like TOW-001
    date: Date,
    vehicle: String,
    route: String,
    amount: Number
  }],
  
  type: { type: String, enum: ['Cash', 'Card', 'Bank Transfer', 'Credit'], default: 'Credit' },
  total: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
  
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// PERFORMANCE INDEXES
InvoiceSchema.index({ id: 1 });
InvoiceSchema.index({ date: -1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ towId: 1 });
InvoiceSchema.index({ status: 1 });

// TEXT INDEX FOR GLOBAL SEARCH
InvoiceSchema.index({ id: 'text', customer: 'text', jobId: 'text' });

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
