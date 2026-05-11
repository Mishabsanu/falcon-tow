import { NextResponse } from 'next/server';
import { aggregateRecords } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const worker = searchParams.get('worker'); // This can be name or ID
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

    // Aggregate Tows
    const tows = await aggregateRecords('tows', [
      matchStage,
      {
        $match: {
          $or: [
            { driver: worker }, 
            { driver: { $regex: worker, $options: 'i' } },
            { driverId: worker }
          ],
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
          $or: [
            { worker: worker },
            { worker: { $regex: worker, $options: 'i' } },
            { workerId: worker }
          ]
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

    const totalCashCollected = tows
      .filter(t => t.paymentMethod === 'Cash')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const totalActualPrice = tows.reduce((sum, t) => sum + (Number(t.amount || 0) - Number(t.serviceCommission || 0)), 0);
    const totalCommissions = tows.reduce((sum, t) => sum + Number(t.serviceCommission || 0), 0);
    
    const totalCommission = totalActualPrice * 0.10;
    const cashDeduction90 = totalCashCollected - (totalCommission); // Worker keeps their 10% from cash if available
    // OR simply:
    // const cashDeduction90 = (totalCashCollected - totalCommissions) * 0.90 + totalCommissions; 
    // Wait, let's keep it simple as per user's split logic.
    
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        tows,
        expenses,
        stats: {
          cashCollected: totalCashCollected,
          totalActualPrice,
          totalCommissions,
          totalCommission,
          cashDeduction90: totalActualPrice * 0.90, // We track what the company should have received
          totalExpensesAmount
        }
      }
    });
  } catch (error) {
    console.error('Calculate single error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
