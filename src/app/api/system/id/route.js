import { connectDB } from '@/lib/mongodb';
import Counter from '@/models/Counter';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const moduleKey = searchParams.get('module');

    if (!moduleKey) {
      return NextResponse.json({ success: false, message: 'Module key required' }, { status: 400 });
    }

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
    
    // Just PEEK at the current sequence without incrementing
    const counter = await Counter.findOne({ id: moduleKey });
    const currentSeq = counter ? counter.seq : 0;
    const nextSeq = (currentSeq + 1).toString().padStart(3, '0');

    return NextResponse.json({ 
      success: true, 
      nextId: `${prefix}-${nextSeq}` 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
