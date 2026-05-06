import { NextResponse } from 'next/server';
import { aggregateRecords } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month'));
  const year = parseInt(searchParams.get('year'));

  if (isNaN(month) || isNaN(year)) {
    return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
  }

  try {
    // 1. Get all active workers from the users collection
    const workers = await aggregateRecords('users', [
      { $match: { role: 'Worker', status: { $ne: 'Inactive' } } }
    ]);

    // 2. Aggregate tows for all workers in that month
    // month is 0-indexed from frontend (0 = Jan)
    // MongoDB $month is 1-indexed (1 = Jan)
    const towsSummary = await aggregateRecords('tows', [
      {
        $addFields: {
          dateObj: { $toDate: "$date" }
        }
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateObj" }, month + 1] },
              { $eq: [{ $year: "$dateObj" }, year] }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$driver",
          totalTows: { $sum: 1 },
          cashCollected: {
            $sum: {
              $cond: [
                { $eq: ["$paymentMethod", "Cash"] },
                { $toDouble: { $ifNull: ["$amount", 0] } },
                0
              ]
            }
          }
        }
      }
    ]);

    // 3. Aggregate expenses for all workers in that month
    const expensesSummary = await aggregateRecords('expenses', [
      {
        $addFields: {
          dateObj: { $toDate: "$date" }
        }
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateObj" }, month + 1] },
              { $eq: [{ $year: "$dateObj" }, year] }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$worker",
          totalExpenses: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }
        }
      }
    ]);

    // 4. Combine data
    const payrollData = workers.map(worker => {
      // Find matching stats by name or id (since driver field might contain either)
      const towStats = towsSummary.find(t => t._id === worker.name || t._id === worker.id) || { totalTows: 0, cashCollected: 0 };
      const expenseStats = expensesSummary.find(e => e._id === worker.name || e._id === worker.id) || { totalExpenses: 0 };
      
      const baseSalary = Number(worker.salary || 0);
      const retention = towStats.cashCollected * 0.90;
      const netSalary = baseSalary - retention - expenseStats.totalExpenses;

      return {
        id: worker.id,
        name: worker.name,
        salary: baseSalary,
        totalTows: towStats.totalTows,
        cashCollected: towStats.cashCollected,
        retention,
        totalExpenses: expenseStats.totalExpenses,
        netSalary
      };
    });

    return NextResponse.json({ success: true, data: payrollData });
  } catch (error) {
    console.error('Payroll summary error:', error);
    return NextResponse.json({ error: 'Failed to calculate payroll' }, { status: 500 });
  }
}
