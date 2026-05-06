import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Tow from '@/models/Tow';
import Invoice from '@/models/Invoice';
import Salary from '@/models/Salary';
import Expense from '@/models/Expense'; // I'll ensure this model exists
import { getDateRange } from '@/lib/dateUtils';
import { startOfDay, endOfDay } from 'date-fns';

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
    if (workerId) dateMatch.driverId = workerId;

    const [tows, invoices, expenses, todayTows, todayInvoices, recentTows, recentInvoices] = await Promise.all([
      // 1. Filtered Tow Stats
      Tow.aggregate([
        { $match: dateMatch },
        { $group: { 
          _id: null, 
          totalAmount: { $sum: { $toDouble: "$amount" } },
          totalCash: { $sum: { $cond: [{ $eq: ["$paymentMethod", "Cash"] }, { $toDouble: "$amount" }, 0] } },
          companyShare: { $sum: { $toDouble: "$companyShare" } },
          driverShare: { $sum: { $toDouble: "$driverShare" } },
          count: { $sum: 1 }
        }}
      ]),
      // 2. Filtered Invoice Stats
      Invoice.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$total" } }, paid: { $sum: { $toDouble: "$paid" } } }}
      ]),
      // 3. Filtered Expenses
      Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } }}
      ]),
      // 4. Today's Specific Tows
      Tow.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
      // 5. Today's Specific Invoices
      Invoice.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$total" } } }}
      ]),
      // 6. Recent Tows
      Tow.find(workerId ? { driverId: workerId } : {}).sort({ date: -1 }).limit(5).lean(),
      // 7. Recent Invoices
      Invoice.find({}).sort({ date: -1 }).limit(5).lean()
    ]);

    const towData = tows[0] || { totalAmount: 0, totalCash: 0, companyShare: 0, driverShare: 0, count: 0 };
    const invData = invoices[0] || { total: 0, paid: 0 };
    const expData = expenses[0] || { total: 0 };
    const todayInvTotal = todayInvoices[0]?.total || 0;

    const stats = [
      { label: 'Total Revenue', value: `QAR ${invData.total.toLocaleString()}`, trend: '+12%', color: 'text-emerald-600', icon: 'Wallet' },
      { label: 'Cash Collected', value: `QAR ${towData.totalCash.toLocaleString()}`, trend: 'Liquid', color: 'text-emerald-500', icon: 'Coins' },
      { label: 'Total Expenses', value: `QAR ${expData.total.toLocaleString()}`, trend: 'Costs', color: 'text-rose-600', icon: 'TrendingDown' },
      { label: 'Total Dispatches', value: towData.count.toString(), trend: 'Active', color: 'text-emerald-950', icon: 'TrendingUp' },
    ];

    const todayPulse = {
      towCount: todayTows,
      invoiceRevenue: todayInvTotal,
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
        pending: invData.total - invData.paid
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
