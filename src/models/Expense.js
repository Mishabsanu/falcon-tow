import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now, index: true },
  description: { type: String },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid', index: true },
  paymentMethod: { type: String },
  reference: { type: String },
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

ExpenseSchema.index({ category: 1 });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
