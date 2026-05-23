import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Tow from '@/models/Tow';
import Invoice from '@/models/Invoice';
import Salary from '@/models/Salary';
import Expense from '@/models/Expense';
import { getDateRange } from '@/lib/dateUtils';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const rangeType = searchParams.get('range') || 'monthly';
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');
    const workerId = searchParams.get('workerId');

    const { start, end } = getDateRange(rangeType, customStart, customEnd);
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Base match conditions for filters
    const dateMatch = { date: { $gte: start, $lte: end } };
    const baseMatch = { date: { $gte: start, $lte: end } };
    
    let objectWorkerId = null;
    if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
      objectWorkerId = new mongoose.Types.ObjectId(workerId);
      dateMatch.driverId = objectWorkerId;
      baseMatch.workerId = objectWorkerId;
    }

    const [tows, invoices, expenses, todayTows, todayInvoices, recentTows, recentInvoices] = await Promise.all([
      // 1. Filtered Tow Stats
      Tow.aggregate([
        { $match: dateMatch },
        { $group: { 
          _id: null, 
          totalAmount: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } },
          totalCash: { $sum: { $cond: [{ $eq: ["$paymentMethod", "Cash"] }, { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } }, 0] } },
          companyShare: { $sum: { $convert: { input: "$companyShare", to: "double", onError: 0, onNull: 0 } } },
          driverShare: { $sum: { $convert: { input: "$driverShare", to: "double", onError: 0, onNull: 0 } } },
          serviceCommission: { $sum: { $convert: { input: "$serviceCommission", to: "double", onError: 0, onNull: 0 } } },
          count: { $sum: 1 }
        }}
      ]),
      // 2. Filtered Invoice Stats
      Invoice.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: { $convert: { input: "$total", to: "double", onError: 0, onNull: 0 } } }, paid: { $sum: { $convert: { input: "$paid", to: "double", onError: 0, onNull: 0 } } } }}
      ]),
      // 3. Filtered Expenses
      Expense.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } } }}
      ]),
      // 4. Today's Specific Tows (Aggregate to get both count and driverShare)
      Tow.aggregate([
        { $match: { 
          date: { $gte: todayStart, $lte: todayEnd },
          ...(objectWorkerId ? { driverId: objectWorkerId } : {})
        } },
        { $group: {
          _id: null,
          count: { $sum: 1 },
          driverShare: { $sum: { $convert: { input: "$driverShare", to: "double", onError: 0, onNull: 0 } } }
        }}
      ]),
      // 5. Today's Specific Invoices
      Invoice.aggregate([
        { $match: { 
          date: { $gte: todayStart, $lte: todayEnd },
          ...(objectWorkerId ? { workerId: objectWorkerId } : {})
        } },
        { $group: { _id: null, total: { $sum: { $convert: { input: "$total", to: "double", onError: 0, onNull: 0 } } } }}
      ]),
      // 6. Recent Tows
      Tow.find(workerId ? { driverId: workerId } : {}).sort({ date: -1 }).limit(5).lean(),
      // 7. Recent Invoices
      Invoice.find(workerId ? { workerId: workerId } : {}).sort({ date: -1 }).limit(5).lean()
    ]);

    const towData = tows[0] || { totalAmount: 0, totalCash: 0, companyShare: 0, driverShare: 0, serviceCommission: 0, count: 0 };
    const invData = invoices[0] || { total: 0, paid: 0 };
    const expData = expenses[0] || { total: 0 };
    const todayInvTotal = todayInvoices[0]?.total || 0;
    const todayTowData = todayTows[0] || { count: 0, driverShare: 0 };

    const stats = workerId ? [
      { label: 'Total Earnings', value: `QAR ${towData.driverShare.toLocaleString()}`, trend: 'Earnings', color: 'text-emerald-600', icon: 'Wallet' },
      { label: 'Cash Collected', value: `QAR ${towData.totalCash.toLocaleString()}`, trend: 'Cash', color: 'text-emerald-500', icon: 'Coins' },
      { label: 'Total Expenses', value: `QAR ${expData.total.toLocaleString()}`, trend: 'Expenses', color: 'text-rose-600', icon: 'TrendingDown' },
      { label: 'Total Dispatches', value: towData.count.toString(), trend: 'Jobs', color: 'text-emerald-950', icon: 'TrendingUp' },
    ] : [
      { label: 'Total Revenue', value: `QAR ${invData.total.toLocaleString()}`, trend: '+12%', color: 'text-emerald-600', icon: 'Wallet' },
      { label: 'Cash Collected', value: `QAR ${towData.totalCash.toLocaleString()}`, trend: 'Cash', color: 'text-emerald-500', icon: 'Coins' },
      { label: 'Total Expenses', value: `QAR ${expData.total.toLocaleString()}`, trend: 'Expenses', color: 'text-rose-600', icon: 'TrendingDown' },
      { label: 'Total Dispatches', value: towData.count.toString(), trend: 'Jobs', color: 'text-emerald-950', icon: 'TrendingUp' },
    ];

    const todayPulse = {
      towCount: todayTowData.count,
      invoiceRevenue: todayInvTotal,
      driverEarnings: todayTowData.driverShare,
      efficiency: 98.4
    };

    return NextResponse.json({ 
      success: true,
      stats, 
      todayPulse,
      recentTows, 
      recentInvoices,
      financials: {
        revenue: invData.total,
        expenses: expData.total,
        profit: invData.total - expData.total,
        paid: invData.paid,
        pending: invData.total - invData.paid,
        driverShare: towData.driverShare,
        companyShare: towData.companyShare,
        serviceCommission: towData.serviceCommission
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
