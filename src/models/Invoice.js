import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  
  customer: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  companyName: { type: String }, // Billing Company Name
  companyNumber: { type: String }, // Billing Contact
  
  worker: { type: String },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicle: { type: String },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  
  towDetails: [{
    towId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tow' },
    jobId: String,
    date: Date,
    vehicleName: String,
    vehiclePlate: String,
    route: String,
    amount: Number,
    serviceCommission: Number,
    driver: String,
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  type: { type: String, enum: ['Cash', 'Card', 'Bank Transfer', 'Credit'], default: 'Credit' },
  totalCharges: { type: Number, default: 0 },
  totalHiddenCharges: { type: Number, default: 0 },
  total: { type: Number, required: true },
  netPayable: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
  commissionStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
  commissionPaid: { type: Number, default: 0 },
  invoicePayments: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    note: { type: String }
  }],
  commissionPayments: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    note: { type: String }
  }],
  
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

if (mongoose.models.Invoice) {
  delete mongoose.models.Invoice;
}
export default mongoose.model('Invoice', InvoiceSchema);
