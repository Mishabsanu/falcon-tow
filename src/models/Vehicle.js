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

export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
