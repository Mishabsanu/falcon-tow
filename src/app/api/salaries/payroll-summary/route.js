import { NextResponse } from 'next/server';
import { aggregateRecords } from '@/lib/store';

export const dynamic = 'force-dynamic';
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
          },
          status: 'Completed'
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
          },
          creditRevenue: {
            $sum: {
              $cond: [
                { $ne: ["$paymentMethod", "Cash"] },
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
          expenseType: 'Worker Advance',
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
      const workerNameClean = (worker.name || '').trim().toLowerCase();
      const workerIdClean = (worker.id || '').trim().toLowerCase();

      // Find matching stats by name or id (trimmed and case-insensitive)
      const towStats = towsSummary.find(t => {
        const tidClean = (t._id || '').trim().toLowerCase();
        return tidClean === workerNameClean || tidClean === workerIdClean;
      }) || { totalTows: 0, cashCollected: 0, creditRevenue: 0 };

      const expenseStats = expensesSummary.find(e => {
        const eidClean = (e._id || '').trim().toLowerCase();
        return eidClean === workerNameClean || eidClean === workerIdClean;
      }) || { totalExpenses: 0 };
      
      const baseSalary = Number(worker.salary || 0);
      const cashCollected = towStats.cashCollected;
      const creditRevenue = towStats.creditRevenue;
      
      // Formula: 
      // 1. Worker is entitled to Base Salary + 10% Commission on ALL revenue.
      // 2. Worker already has 100% of Cash Collected.
      // 3. We subtract 100% of Cash Collected (as Hand Cash deduction).
      const commission = (cashCollected + creditRevenue) * 0.10;
      const retention = cashCollected;
      
      const netSalary = baseSalary + commission - cashCollected - expenseStats.totalExpenses;

      return {
        id: worker.id,
        name: worker.name,
        salary: baseSalary,
        totalTows: towStats.totalTows,
        cashCollected: cashCollected,
        creditRevenue: creditRevenue,
        commission,
        retention,
        totalExpenses: expenseStats.totalExpenses,
        netSalary: Math.round(netSalary * 100) / 100
      };
    });

    return NextResponse.json({ success: true, data: payrollData });
  } catch (error) {
    console.error('Payroll summary error:', error);
    return NextResponse.json({ error: 'Failed to calculate payroll' }, { status: 500 });
  }
}
