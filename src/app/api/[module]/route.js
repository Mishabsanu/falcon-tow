import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { moduleData } from '@/lib/moduleData';

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
import { generateNextId } from '@/lib/idGenerator';
import { createNotification } from '@/utils/createNotification';
import NotificationModel from '@/models/Notification';

const models = {
  users: User,
  tows: Tow,
  customers: Customer,
  vehicles: Vehicle,
  salaries: Salary,
  invoices: Invoice,
  expenses: Expense,
  quotations: Quotation,
  notifications: NotificationModel,
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

    // 1. Build Base Filter Query (Excludes search 'q')
    let filterQuery = {};
    searchParams.forEach((value, key) => {
      // Skip pagination and global search keys
      if (['q', 'page', 'limit', 'sort', 'order', 'select'].includes(key) || value === 'All') return;

      // Handle Date Ranges
      if (key === 'startDate' || key === 'endDate') {
        const dateField = moduleKey === 'tows' ? 'date' : 
                         moduleKey === 'invoices' ? 'date' : 
                         moduleKey === 'expenses' ? 'date' : 
                         moduleKey === 'quotations' ? 'date' : 'createdAt';
        
        if (!filterQuery[dateField]) filterQuery[dateField] = {};
        if (key === 'startDate') filterQuery[dateField].$gte = value;
        if (key === 'endDate') filterQuery[dateField].$lte = value;
        return;
      }

      // Handle Specific Field Filtering
      if (key.endsWith('Id') || key === '_id') {
        try { filterQuery[key] = value; } catch(e) {}
      } else {
        filterQuery[key] = value;
      }
    });

    // 2. Build Global Search Query
    let searchQuery = {};
    if (q) {
      const searchFields = [];
      if (moduleKey === 'users') searchFields.push('id', 'name', 'email', 'phone', 'role');
      else if (moduleKey === 'tows') searchFields.push('id', 'customer', 'vehicle', 'driver', 'pickup', 'dropoff', 'customerPlate', 'customerVehicle');
      else if (moduleKey === 'customers') searchFields.push('id', 'name', 'phone', 'email', 'companyName', 'address');
      else if (moduleKey === 'vehicles') searchFields.push('id', 'name', 'plate', 'modelRef', 'year');
      else if (moduleKey === 'expenses') searchFields.push('id', 'description', 'worker', 'vehicle', 'category');
      else if (moduleKey === 'invoices') searchFields.push('id', 'customer', 'worker', 'jobId', 'companyName', 'status');
      else if (moduleKey === 'quotations') searchFields.push('id', 'customer', 'driver', 'pickup', 'dropoff', 'customerPlate');
      else if (moduleKey === 'salaries') searchFields.push('id', 'worker', 'month', 'year', 'status');
      else searchFields.push('id', 'name');
      
      if (searchFields.length > 0) {
        searchQuery.$or = searchFields.map(field => ({ [field]: { $regex: q, $options: 'i' } }));
      }
    }

    // 3. Final Query (Filters + Search)
    const finalQuery = q ? { $and: [filterQuery, searchQuery] } : filterQuery;

    const select = searchParams.get('select') || '';
    const sort = searchParams.get('sort') || (moduleKey === 'tows' ? 'date' : 'createdAt');
    const order = parseInt(searchParams.get('order')) || -1;

    // 4. Calculate Summary (Based on Filters ONLY, ignores Search 'q')
    // This satisfies the requirement: "when I search that time widget should not affect"
    const globalCount = await Model.countDocuments({}); // Truly global
    const filteredCount = await Model.countDocuments(filterQuery);
    
    let summaryExtra = {};

    // Calculate Status-based counts within the filtered set
    const statusStats = await Model.aggregate([
      { $match: filterQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const statusCounts = {};
    statusStats.forEach(s => { if (s._id) statusCounts[s._id] = s.count; });

    if (['invoices', 'expenses', 'salaries', 'tows', 'quotations'].includes(moduleKey)) {
      const fieldToSum = moduleKey === 'invoices' ? 'total' : 'amount';
      summaryExtra = { totalAmount: 0, paidAmount: 0, dueAmount: 0 };
      
      const stats = await Model.aggregate([
        { $match: filterQuery },
        { 
          $group: { 
            _id: null, 
            totalAmount: { $sum: { $convert: { input: `$${fieldToSum}`, to: "double", onError: 0, onNull: 0 } } },
            paidAmount: { $sum: { $convert: { input: { $ifNull: ["$paid", 0] }, to: "double", onError: 0, onNull: 0 } } }
          } 
        }
      ]);
      if (stats.length > 0) {
        summaryExtra = {
          totalAmount: stats[0].totalAmount || 0,
          paidAmount: stats[0].paidAmount || 0,
          dueAmount: (stats[0].totalAmount || 0) - (stats[0].paidAmount || 0)
        };
      }
    }

    const total = await Model.countDocuments(finalQuery);
    let dataQuery = Model.find(finalQuery)
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);

    if (select) {
      dataQuery = dataQuery.select(select.split(',').join(' '));
    }

    const data = await dataQuery.lean();

    // DYNAMIC JOIN ENRICHMENT (Optimized Batch Fetching)
    const config = moduleData[moduleKey];
    const joins = config?.joins || [];
    let enrichedData = data;

    if (joins.length > 0 && data.length > 0) {
      for (const join of joins) {
        const JoinModel = models[join.from];
        if (JoinModel) {
          // Extract unique local keys to avoid redundant lookups
          const localKeys = [...new Set(data.map(item => item[join.localField]?.toString()).filter(Boolean))];
          
          if (localKeys.length > 0) {
            const joinedRecords = await JoinModel.find({ [join.foreignField]: { $in: localKeys } }).lean();
            
            // Map records for O(1) lookup during enrichment
            const recordMap = {};
            joinedRecords.forEach(rec => {
              recordMap[rec[join.foreignField].toString()] = rec;
            });

            enrichedData = enrichedData.map(item => {
              const localVal = item[join.localField];
              if (localVal) {
                item[join.as] = recordMap[localVal.toString()] || null;
              }
              return item;
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
      summary: {
        global: globalCount,
        total: filteredCount,
        statusCounts,
        ...summaryExtra
      },
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

export async function POST(request, context) {
  try {
    await connectDB();
    const { module: moduleKey } = await context.params;
    const Model = models[moduleKey];
    let payload = await request.json();

    // Trim strings recursively/deeply
    payload = trimStrings(payload);

    // Sanitize Payload: Convert empty strings to undefined to allow Mongoose defaults/validation
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') payload[key] = undefined;
    });

    // Auto-Cast Numeric Fields based on module configuration
    const config = moduleData[moduleKey];
    if (config?.fields) {
      config.fields.forEach(field => {
        if (field.type === 'number' && typeof payload[field.name] === 'string') {
          const num = parseFloat(payload[field.name]);
          if (!isNaN(num)) payload[field.name] = num;
        }
      });
    }

    if (!Model) {
      return NextResponse.json({ success: false, message: 'Module configuration missing' }, { status: 404 });
    }

    // Force backend ID generation for consistency
    payload.id = await generateNextId(moduleKey);

    // Security: Hash password if creating a user
    if (moduleKey === 'users' && payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    // Business Logic: Auto-calculate Tow Shares
    if (moduleKey === 'tows' && payload.amount !== undefined) {
      const amt = Number(payload.amount || 0);
      const commission = Number(payload.serviceCommission || 0);
      const actualPrice = Math.max(0, amt - commission);
      payload.driverShare = Math.round(actualPrice * 0.1 * 100) / 100;
      payload.companyShare = Math.round(actualPrice * 0.9 * 100) / 100;
    }

    const record = await Model.create(payload);

    // Trigger Notification Hook
    try {
      if (moduleKey === 'tows') {
        await createNotification({
          title: 'New Tow Job Assigned',
          message: `Service for ${payload.customer} at ${payload.pickup} has been registered.`,
          type: 'tow',
          userId: payload.driverId,
          referenceId: record.id
        });
      } else if (moduleKey === 'expenses') {
        await createNotification({
          title: 'New Expense Registered',
          message: `${payload.description} - QAR ${payload.amount}`,
          type: 'payment',
          referenceId: record.id
        });
      } else if (moduleKey === 'invoices') {
        await createNotification({
          title: 'Invoice Generated',
          message: `Invoice ${record.id} created for ${payload.customer}`,
          type: 'payment',
          referenceId: record.id
        });
      } else if (moduleKey === 'vehicles') {
        await createNotification({
          title: 'New Fleet Asset Added',
          message: `${payload.name} (${payload.plate}) registered in the fleet.`,
          type: 'status',
          referenceId: record.id
        });
      }
    } catch (notifErr) {
      console.warn('[NOTIFICATION_HOOK_FAILED]', notifErr.message);
    }

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error(`[API_ERROR] ${request.url}:`, error);
    
    let message = error.message;
    if (error.code === 11000) {
      message = "Duplicate Entry: A record with this unique ID or field already exists in the system.";
    } else if (error.errors) {
      message = Object.values(error.errors).map(e => e.message).join(', ');
    }

    return NextResponse.json({ 
      success: false, 
      message: message 
    }, { status: 400 });
  }
}
