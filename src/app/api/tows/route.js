import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Tow from '@/models/Tow';
import { calculateTowShares } from '@/modules/tows/logic/towBusinessLogic';
import { generateNextId } from '@/lib/idGenerator';
import { createNotification } from '@/utils/createNotification';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (q) {
      // High-performance Text Search
      query.$text = { $search: q };
    }

    // Apply specific filters if present
    const status = searchParams.get('status');
    if (status && status !== 'All') query.status = status;

    const driver = searchParams.get('driver');
    if (driver) query.driver = driver;

    const driverId = searchParams.get('driverId');
    if (driverId) query.driverId = driverId;

    const vehicle = searchParams.get('vehicle');
    if (vehicle) query.vehicle = vehicle;

    const customer = searchParams.get('customer');
    if (customer) query.customer = customer;

    const customerId = searchParams.get('customerId');
    if (customerId) query.customerId = customerId;

    const paymentMethod = searchParams.get('paymentMethod');
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Handle Date Range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const total = await Tow.countDocuments(query);
    const data = await Tow.find(query)
      .select('id date customer customerId customerVehicle customerPlate vehicle driver pickup dropoff amount serviceCommission status createdAt') // Projection: Only what we need
      .sort(q ? { score: { $meta: "textScore" } } : { date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const payload = await request.json();

    // Force backend ID generation to ensure Counter is updated
    payload.id = await generateNextId('tows');

    // SERVER-SIDE BUSINESS LOGIC
    // We recalculate shares on the server to prevent tampering
    const shares = calculateTowShares(payload.amount, payload.serviceCommission);
    const finalPayload = {
      ...payload,
      driverShare: shares.driverShare,
      companyShare: shares.companyShare
    };

    const record = await Tow.create(finalPayload);

    // Trigger Notification Hook (Consistent with generic module route)
    try {
      await createNotification({
        title: 'New Tow Job Assigned',
        message: `Service for ${payload.customer} at ${payload.pickup} has been registered.`,
        type: 'tow',
        userId: payload.driverId,
        referenceId: record.id
      });
    } catch (notifErr) {
      console.warn('[NOTIFICATION_HOOK_FAILED]', notifErr.message);
    }

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
