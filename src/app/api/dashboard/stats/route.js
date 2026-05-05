import { NextResponse } from 'next/server';
import { aggregateRecords } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get('workerId');
  
  // Base match conditions for filtering
  const towMatch = workerId ? { driverId: workerId } : {};
  const invoiceMatch = workerId ? { workerId: workerId } : {};

  try {
    // Optimized using Aggregation Pipelines
    const [towsStats, invoicesStats, recentTows] = await Promise.all([
      aggregateRecords('tows', [
        { $match: towMatch },
        {
          $facet: {
            cashStats: [
              { $match: { paymentMethod: 'Cash' } },
              { $group: { _id: null, totalCash: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } } } }
            ],
            shareStats: [
              { $group: { 
                _id: null, 
                totalDriverShare: { $sum: { $toDouble: { $ifNull: ["$driverShare", 0] } } },
                totalCompanyShare: { $sum: { $toDouble: { $ifNull: ["$companyShare", 0] } } }
              }}
            ]
          }
        }
      ]),
      aggregateRecords('invoices', [
        { $match: invoiceMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: { $ifNull: ["$total", 0] } } },
            totalPaid: { $sum: { $toDouble: { $ifNull: ["$paid", 0] } } }
          }
        }
      ]),
      aggregateRecords('tows', [
        { $match: towMatch },
        { $sort: { id: -1 } },
        { $limit: 5 },
        {
          $project: {
            id: 1,
            customer: 1,
            vehicle: 1,
            location: { $ifNull: ["$pickup", 'N/A'] },
            status: 1,
            amount: { $concat: ["QAR ", { $toString: "$amount" }] }
          }
        }
      ])
    ]);

    const totalCashCollected = towsStats[0]?.cashStats[0]?.totalCash || 0;
    const totalDriverShare = towsStats[0]?.shareStats[0]?.totalDriverShare || 0;
    const totalCompanyShare = towsStats[0]?.shareStats[0]?.totalCompanyShare || 0;
    
    const totalRevenue = invoicesStats[0]?.totalRevenue || 0;
    const totalPaid = invoicesStats[0]?.totalPaid || 0;
    const totalPending = totalRevenue - totalPaid;

    const stats = [
      { label: workerId ? 'My Total Billing' : 'Total Revenue', value: `QAR ${totalRevenue.toLocaleString()}`, trend: workerId ? 'Personal' : '+12%', color: 'text-emerald-600', icon: 'Wallet' },
      { label: workerId ? 'Cash in Hand' : 'Cash Collected', value: `QAR ${totalCashCollected.toLocaleString()}`, trend: 'Liquid', color: 'text-emerald-500', icon: 'Coins' },
      { label: workerId ? 'My Earnings (10%)' : 'Company Share (90%)', value: `QAR ${workerId ? totalDriverShare.toLocaleString() : totalCompanyShare.toLocaleString()}`, trend: workerId ? '10%' : '90%', color: 'text-emerald-950', icon: 'TrendingUp' },
      { label: workerId ? 'Company Due (90%)' : 'Driver Share (10%)', value: `QAR ${workerId ? totalCompanyShare.toLocaleString() : totalDriverShare.toLocaleString()}`, trend: workerId ? '90%' : '10%', color: 'text-emerald-700', icon: 'Users' },
    ];

    const financials = {
      totalRevenue,
      totalPaid,
      totalPending,
      totalCashCollected,
      totalDriverShare,
      totalCompanyShare
    };

    return NextResponse.json({ stats, recentTows, financials });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
