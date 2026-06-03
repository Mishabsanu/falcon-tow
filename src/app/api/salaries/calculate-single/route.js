import { NextResponse } from 'next/server';
import { aggregateRecords } from '@/lib/store';
import { ObjectId } from 'mongodb';

function escapeRegExp(val) {
  return String(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const workerRaw = searchParams.get('worker');
  const worker = workerRaw ? workerRaw.trim() : '';
  const month = parseInt(searchParams.get('month'));
  const year = parseInt(searchParams.get('year'));

  if (!worker || isNaN(month) || isNaN(year)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // MongoDB $month is 1-indexed
    const matchStage = {
      $addFields: { dateObj: { $toDate: "$date" } }
    };
    const filterStage = {
      $match: {
        $expr: {
          $and: [
            { $eq: [{ $month: "$dateObj" }, month + 1] },
            { $eq: [{ $year: "$dateObj" }, year] }
          ]
        }
      }
    };

    const workerRegexPattern = `^\\s*${escapeRegExp(worker)}\\s*$`;
    let workerIdObj = null;
    if (/^[0-9a-fA-F]{24}$/.test(worker)) {
      try {
        workerIdObj = new ObjectId(worker);
      } catch (e) {}
    }

    const driverMatchConditions = [
      { driver: { $regex: workerRegexPattern, $options: 'i' } }
    ];
    if (workerIdObj) {
      driverMatchConditions.push({ driverId: workerIdObj });
    } else {
      driverMatchConditions.push({ driverId: worker });
    }

    const workerMatchConditions = [
      { worker: { $regex: workerRegexPattern, $options: 'i' } }
    ];
    if (workerIdObj) {
      workerMatchConditions.push({ workerId: workerIdObj });
    } else {
      workerMatchConditions.push({ workerId: worker });
    }

    // Aggregate Tows
    const tows = await aggregateRecords('tows', [
      matchStage,
      {
        $match: {
          $or: driverMatchConditions,
          status: 'Completed'
        }
      },
      filterStage,
      {
        $project: {
          id: 1,
          date: 1,
          customer: 1,
          driver: 1,
          vehicle: 1,
          amount: 1,
          serviceCommission: 1,
          paymentMethod: 1
        }
      }
    ]);

    // Aggregate Expenses
    const expenses = await aggregateRecords('expenses', [
      matchStage,
      {
        $match: {
          $or: workerMatchConditions
        }
      },
      filterStage,
      {
        $project: {
          id: 1,
          date: 1,
          amount: 1,
          description: 1,
          worker: 1,
          vehicle: 1
        }
      }
    ]);

    const creditTows = tows.filter(t => t.paymentMethod !== 'Cash');
    const cashTows = tows.filter(t => t.paymentMethod === 'Cash');

    const totalCreditRevenue = creditTows.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalCashCollected = cashTows.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const credit10 = Math.round(totalCreditRevenue * 0.10 * 100) / 100;
    const credit90 = Math.round(totalCreditRevenue * 0.90 * 100) / 100;
    const cash10 = Math.round(totalCashCollected * 0.10 * 100) / 100;
    const cash90 = Math.round(totalCashCollected * 0.90 * 100) / 100;

    const totalActualPrice = tows.reduce((sum, t) => sum + (Number(t.amount || 0) - Number(t.serviceCommission || 0)), 0);
    const totalCommissions = tows.reduce((sum, t) => sum + Number(t.serviceCommission || 0), 0);
    const totalCommission = credit10 + cash10;
    
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        tows,
        expenses,
        stats: {
          cashCollected: totalCashCollected,
          creditRevenue: totalCreditRevenue,
          credit10,
          credit90,
          cash10,
          cash90,
          totalActualPrice,
          totalCommissions,
          totalCommission,
          cashDeduction90: cash90,
          totalExpensesAmount
        }
      }
    });
  } catch (error) {
    console.error('Calculate single error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
