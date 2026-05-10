import Counter from '@/models/Counter';
import { getDb } from './mongodb';

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
  const db = await getDb();
  const collection = db.collection(moduleKey);
  
  let nextId = '';
  let isUnique = false;

  // Collision-aware generation: Increment until we find a truly unique ID
  while (!isUnique) {
    const counter = await Counter.findOneAndUpdate(
      { id: moduleKey },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );

    const sequenceNumber = counter.seq.toString().padStart(3, '0');
    nextId = `${prefix}-${sequenceNumber}`;

    // Verify if this ID already exists in the destination collection
    const existing = await collection.findOne({ id: nextId });
    if (!existing) {
      isUnique = true;
    }
  }

  return nextId;
}
