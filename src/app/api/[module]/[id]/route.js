import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
export const dynamic = 'force-dynamic';
import User from '@/models/User';
import Tow from '@/models/Tow';
import Customer from '@/models/Customer';
import Vehicle from '@/models/Vehicle';
import Salary from '@/models/Salary';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';
import Quotation from '@/models/Quotation';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'falcon_secret_key_luxury'
);

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
    let query = Model.findOne({ $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    
    if (moduleKey === 'users') {
      query = query.select('-password');
    }
    
    const record = await query.lean();

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function trimStrings(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(trimStrings);
  }
  if (typeof obj === 'object') {
    const proto = Object.getPrototypeOf(obj);
    if (proto === null || proto === Object.prototype) {
      const result = {};
      Object.keys(obj).forEach(key => {
        result[key] = trimStrings(obj[key]);
      });
      return result;
    }
  }
  return obj;
}

export async function PUT(request, context) {
  try {
    await connectDB();
    const { module: moduleKey, id } = await context.params;
    const Model = models[moduleKey];
    const payload = trimStrings(await request.json());
    if (!Model) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    // Protect immutable fields
    delete payload.id;
    delete payload._id;

    if (moduleKey === 'users') {
      if (payload.password && payload.password.trim() !== '') {
        // Only hash if a new password was actually provided
        if (!payload.password.startsWith('$2')) {
          payload.password = await bcrypt.hash(payload.password, 10);
        }
      } else {
        // Remove password from payload if it's empty to prevent overwriting with null/empty
        delete payload.password;
      }
    }

    if (moduleKey === 'tows') {
      let userRole = 'Worker';
      try {
        const token = request.cookies.get('token')?.value;
        if (token) {
          const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
          userRole = jwtPayload.role || 'Worker';
        }
      } catch (err) {
        console.error('[API_AUTH_WARN] Failed to verify JWT token in PUT API:', err.message);
      }

      const normalizedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

      // Find the existing record first
      const queryFind = { $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] };
      const existingRecord = await Model.findOne(queryFind);
      if (!existingRecord) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      // Check if dropping/completing details are being filled or status changed to Completed
      const isCompleting = payload.status === 'Completed' || payload.dropoff || payload.dropoffPhoto;

      if (isCompleting && normalizedRole === 'Worker') {
        // Validation 1: Time Elapsed (must wait at least 10 minutes from creation)
        if (existingRecord.createdAt) {
          const createdTime = new Date(existingRecord.createdAt).getTime();
          const now = Date.now();
          const diffMinutes = (now - createdTime) / 60000;
          if (diffMinutes < 10) {
            return NextResponse.json({
              error: 'Safety Lock: A tow job must run for at least 10 minutes before drop-off details can be submitted.'
            }, { status: 400 });
          }
        }

        // Validation 2: Location Similarity check
        const newPickup = payload.pickup || existingRecord.pickup;
        const newDropoff = payload.dropoff || existingRecord.dropoff;
        if (newPickup && newDropoff && newPickup.trim().toLowerCase() === newDropoff.trim().toLowerCase()) {
          return NextResponse.json({
            error: 'Validation Error: Pickup and drop-off locations cannot be identical.'
          }, { status: 400 });
        }

        // Validation 3: Photo duplicate check
        const newPickupPhoto = payload.pickupPhoto || existingRecord.pickupPhoto;
        const newDropoffPhoto = payload.dropoffPhoto || existingRecord.dropoffPhoto;
        const placeholderUrl = 'https://res.cloudinary.com/dwkom79iv/image/upload/v1714578144/uploading_placeholder.png';
        if (newPickupPhoto && newDropoffPhoto && 
            newPickupPhoto !== placeholderUrl && 
            newDropoffPhoto !== placeholderUrl && 
            newPickupPhoto === newDropoffPhoto) {
          return NextResponse.json({
            error: 'Validation Error: Pickup proof and drop-off proof cannot be the same image.'
          }, { status: 400 });
        }
      }
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
