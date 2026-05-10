import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  plate: { type: String, required: true, unique: true },
  modelRef: { type: String },
  year: { type: String },
  engineRef: { type: String },
  chassisRef: { type: String },
  insuranceExpiry: { type: Date },
  registrationExpiry: { type: Date },
  status: { 
    type: String, 
    enum: ['Available', 'In Use', 'Maintenance'], 
    default: 'Available',
    set: v => {
      if (!v) return v;
      const normalized = v.toLowerCase().trim();
      if (normalized === 'in use') return 'In Use';
      return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    }
  },
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// PERFORMANCE INDEXES
VehicleSchema.index({ name: 1 });
VehicleSchema.index({ plate: 1 });
VehicleSchema.index({ id: 1 });
VehicleSchema.index({ insuranceExpiry: 1 });
VehicleSchema.index({ registrationExpiry: 1 });

// TEXT INDEX FOR GLOBAL SEARCH
VehicleSchema.index({ name: 'text', plate: 'text', id: 'text', modelRef: 'text' });

export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
