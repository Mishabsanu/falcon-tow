import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // EMP-001
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['Administrator', 'Worker', 'Manager', 'Accountant'], default: 'Worker' },
  salary: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

// Avoid re-compilation in development
export default mongoose.models.User || mongoose.model('User', UserSchema);
