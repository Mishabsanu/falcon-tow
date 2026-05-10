import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Tow from '@/models/Tow';
import Customer from '@/models/Customer';
import Vehicle from '@/models/Vehicle';
import Salary from '@/models/Salary';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';
import Quotation from '@/models/Quotation';
import bcrypt from 'bcryptjs';

const models = {
  users: User,
  tows: Tow,
  customers: Customer,
  vehicles: Vehicle,
  salaries: Salary,
  invoices: Invoice,
  expenses: Expense,
  quotations: Quotation,
};

export const runtime = 'nodejs';

export async function GET(_request, context) {
  try {
    await connectDB();
    const { module: moduleKey, id } = await context.params;
    const Model = models[moduleKey];

    if (!Model) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    // Try finding by custom ID string (e.g. TOW-001) or MongoDB _id
    const record = await Model.findOne({ $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }).lean();

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    await connectDB();
    const { module: moduleKey, id } = await context.params;
    const Model = models[moduleKey];
    const payload = await request.json();
    if (!Model) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    // Protect immutable fields
    delete payload.id;
    delete payload._id;

    if (moduleKey === 'users' && payload.password && !payload.password.startsWith('$2')) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    const record = await Model.findOneAndUpdate(
      { $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      payload,
      { new: true }
    );

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  try {
    await connectDB();
    const { module: moduleKey, id } = await context.params;
    const Model = models[moduleKey];

    if (!Model) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    // CRITICAL: Block deletion of the System Admin account (Root Protection)
    if (moduleKey === 'users' && id === 'EMP-001') {
      return NextResponse.json({ 
        error: 'System Protection: The Root Administrator account cannot be deleted to prevent system lockout.' 
      }, { status: 403 });
    }

    const deleted = await Model.findOneAndDelete({ $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });

    if (!deleted) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id, deleted: true } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
