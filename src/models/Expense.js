import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now, index: true },
  amount: { type: Number, required: true },
  description: { type: String },

  worker: { type: String },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  vehicle: { type: String },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
