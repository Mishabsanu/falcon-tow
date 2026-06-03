import mongoose from 'mongoose';

const SalarySchema = new mongoose.Schema({
  id: { type: String, required: true }, // SAL-123
  month: { type: String, required: true },
  year: { type: String, required: true },
  
  worker: { type: String },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  baseSalary: { type: Number, default: 0 },
  cashCollected: { type: Number, default: 0 },
  creditRevenue: { type: Number, default: 0 },
  retention: { type: Number, default: 0 },
  credit10: { type: Number, default: 0 },
  credit90: { type: Number, default: 0 },
  cash10: { type: Number, default: 0 },
  cash90: { type: Number, default: 0 },
  totalCommissions: { type: Number, default: 0 }, // Hidden Charges/Owner Commission
  cashDeduction90: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  createdBy: { type: String },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Salary || mongoose.model('Salary', SalarySchema);
