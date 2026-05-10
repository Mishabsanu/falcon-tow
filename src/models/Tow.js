import mongoose from 'mongoose';

const TowSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // TOW-001
  date: { type: Date, required: true },
  
  // Relations
  driver: { type: String },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  vehicle: { type: String },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  vehicleName: { type: String },
  vehiclePlate: { type: String },
  
  customer: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  
  // Job details
  customerVehicle: { type: String },
  customerPlate: { type: String },
  
  pickup: { type: String },
  dropoff: { type: String },
  
  pickupPhoto: { type: String }, // Cloudinary URL
  dropoffPhoto: { type: String }, // Cloudinary URL
  
  // Financials
  paymentMethod: { type: String, enum: ['Cash', 'Credit'], default: 'Credit' },
  amount: { type: Number, required: true },
  driverShare: { type: Number, default: 0 },
  companyShare: { type: Number, default: 0 },
  
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'Completed', index: true },
  
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now, index: true }
});

// INDEXES FOR PERFORMANCE
TowSchema.index({ id: 1 });
TowSchema.index({ date: -1 });
TowSchema.index({ driverId: 1 });
TowSchema.index({ customerId: 1 });
TowSchema.index({ vehicleId: 1 });

// TEXT INDEX FOR HIGH-SPEED GLOBAL SEARCH
TowSchema.index({ 
  id: 'text', 
  customer: 'text', 
  vehicle: 'text', 
  driver: 'text', 
  pickup: 'text', 
  dropoff: 'text' 
});

export default mongoose.models.Tow || mongoose.model('Tow', TowSchema);
