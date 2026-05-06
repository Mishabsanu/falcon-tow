import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Tow from '@/models/Tow';
import Customer from '@/models/Customer';
import Vehicle from '@/models/Vehicle';
import Salary from '@/models/Salary';
import Invoice from '@/models/Invoice';
import bcrypt from 'bcryptjs';

const models = {
  users: User,
  tows: Tow,
  customers: Customer,
  vehicles: Vehicle,
  salaries: Salary,
  invoices: Invoice,
};

export const runtime = 'nodejs';

export async function GET(request, context) {
  try {
    await connectDB();
    const { module: moduleKey } = await context.params;
    const Model = models[moduleKey];

    if (!Model) {
      return NextResponse.json({ success: false, message: 'Module configuration missing' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Global Search
    if (q) {
      const searchFields = [];
      if (moduleKey === 'users') searchFields.push('name', 'email', 'id');
      else if (moduleKey === 'tows') searchFields.push('id', 'customer', 'vehicle', 'driver');
      else if (moduleKey === 'customers') searchFields.push('name', 'phone', 'email');
      else if (moduleKey === 'vehicles') searchFields.push('name', 'plate');
      
      if (searchFields.length > 0) {
        query.$or = searchFields.map(field => ({ [field]: { $regex: q, $options: 'i' } }));
      }
    }

    // 2. Filters & Search
    searchParams.forEach((value, key) => {
      // Skip pagination and global search keys
      if (['q', 'page', 'limit'].includes(key) || value === 'All') return;

      // Handle Date Ranges
      if (key === 'startDate' || key === 'endDate') {
        const dateField = moduleKey === 'tows' ? 'date' : 
                         moduleKey === 'invoices' ? 'date' : 
                         moduleKey === 'expenses' ? 'date' : 
                         moduleKey === 'quotations' ? 'date' : 'createdAt';
        
        if (!query[dateField]) query[dateField] = {};
        if (key === 'startDate') query[dateField].$gte = value;
        if (key === 'endDate') query[dateField].$lte = value;
        return;
      }

      // Handle Specific Field Filtering
      if (key.endsWith('Id') || key === '_id') {
        try { query[key] = value; } catch(e) {}
      } else {
        query[key] = value;
      }
    });

    const total = await Model.countDocuments(query);
    const data = await Model.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`[API_ERROR] ${request.url}:`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request, context) {
  try {
    await connectDB();
    const { module: moduleKey } = await context.params;
    const Model = models[moduleKey];
    const payload = await request.json();

    if (!Model) {
      return NextResponse.json({ success: false, message: 'Module configuration missing' }, { status: 404 });
    }

    // Security: Hash password if creating a user
    if (moduleKey === 'users' && payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    const record = await Model.create(payload);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error(`[API_ERROR] ${request.url}:`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
