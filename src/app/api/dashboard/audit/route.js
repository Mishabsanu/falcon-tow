import { NextResponse } from "next/server";
import { listRecords } from "@/lib/store";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ success: false, message: "Date parameter is required" }, { status: 400 });
    }

    // Fetch all relevant data for the audit
    // We fetch a larger limit to ensure we get everything for that day
    const [towsResult, expensesResult] = await Promise.all([
      listRecords('tows', { limit: 5000 }),
      listRecords('expenses', { limit: 5000 })
    ]);

    const tows = towsResult?.data || [];
    const expenses = expensesResult?.data || [];

    // Filter by the specific date
    const dailyServices = tows.filter(t => t.date === date);
    const dailyExpenses = expenses.filter(e => e.date === date);

    // Calculate Summary
    const totalServices = dailyServices.length;
    const cashServices = dailyServices.filter(s => s.paymentMethod === 'Cash');
    const totalCash = cashServices.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    
    // We use the driverShare/companyShare fields if available, otherwise calculate on fly
    const driverShare = cashServices.reduce((sum, s) => sum + Number(s.driverShare || (Number(s.amount) * 0.1)), 0);
    const companyShare = cashServices.reduce((sum, s) => sum + Number(s.companyShare || (Number(s.amount) * 0.9)), 0);
    const totalExpenses = dailyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalServices,
          totalCash,
          driverShare,
          companyShare,
          totalExpenses
        },
        services: dailyServices.map(s => ({
          id: s.id,
          worker: s.driver,
          paymentMethod: s.paymentMethod,
          amount: s.amount,
          driverShare: s.paymentMethod === 'Cash' ? (s.driverShare || (Number(s.amount) * 0.1).toFixed(2)) : '0.00',
          companyShare: s.paymentMethod === 'Cash' ? (s.companyShare || (Number(s.amount) * 0.9).toFixed(2)) : '0.00'
        })),
        expenses: dailyExpenses.map(e => ({
          description: e.description,
          worker: e.worker,
          vehicle: e.vehicle,
          amount: e.amount
        }))
      }
    });
  } catch (error) {
    console.error("Audit API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
