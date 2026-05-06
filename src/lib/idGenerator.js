import Counter from '@/models/Counter';

export async function generateNextId(moduleKey) {
  const prefixes = {
    users: 'EMP',
    tows: 'TOW',
    invoices: 'INV',
    customers: 'CUS',
    vehicles: 'VEH',
    salaries: 'SAL',
    expenses: 'EXP',
    quotations: 'QTE'
  };

  const prefix = prefixes[moduleKey] || moduleKey.substring(0, 3).toUpperCase();
  
  const counter = await Counter.findOneAndUpdate(
    { id: moduleKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequenceNumber = counter.seq.toString().padStart(4, '0');
  return `${prefix}-${sequenceNumber}`;
}
