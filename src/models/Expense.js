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

// PERFORMANCE INDEXES
ExpenseSchema.index({ id: 1 });
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ workerId: 1 });
ExpenseSchema.index({ vehicleId: 1 });

// TEXT INDEX FOR GLOBAL SEARCH
ExpenseSchema.index({ id: 'text', description: 'text', worker: 'text' });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
