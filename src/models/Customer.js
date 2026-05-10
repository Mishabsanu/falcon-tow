import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active',
    set: v => {
      if (!v) return 'Active';
      const normalized = v.trim().toLowerCase();
      if (normalized === 'inactive') return 'Inactive';
      return 'Active';
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// PERFORMANCE INDEXES
CustomerSchema.index({ name: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ id: 1 });

// TEXT INDEX FOR GLOBAL SEARCH
CustomerSchema.index({ name: 'text', email: 'text', phone: 'text', id: 'text' });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
