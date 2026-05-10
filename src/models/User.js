import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // EMP-001
  name: { type: String, required: true },
  email: { type: String, required: false, sparse: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['Administrator', 'Worker', 'Manager', 'Accountant'], default: 'Worker' },
  salary: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'On Leave', 'Inactive'], 
    default: 'Active',
    set: v => {
      if (!v) return v;
      const normalized = v.toLowerCase().trim();
      if (normalized === 'on leave') return 'On Leave';
      return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    }
  },
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// PERFORMANCE INDEXES
UserSchema.index({ name: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ id: 1 });
UserSchema.index({ role: 1 });

// TEXT INDEX FOR GLOBAL SEARCH
UserSchema.index({ name: 'text', email: 'text', id: 'text', phone: 'text' });

// Avoid re-compilation in development
export default mongoose.models.User || mongoose.model('User', UserSchema);
