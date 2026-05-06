import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  plate: { type: String, required: true, unique: true },
  modelRef: { type: String },
  year: { type: String },
  engineRef: { type: String },
  chassisRef: { type: String },
  insuranceExpiry: { type: Date },
  registrationExpiry: { type: Date },
  status: { type: String, enum: ['Available', 'In Use', 'Maintenance'], default: 'Available' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
