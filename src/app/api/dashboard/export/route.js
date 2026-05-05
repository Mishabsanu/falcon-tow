import { NextResponse } from "next/server";
import { listRecords } from "@/lib/store";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const customer = searchParams.get("customer");
    const worker = searchParams.get("worker");
    const vehicle = searchParams.get("vehicle");

    if (!module) {
      return NextResponse.json({ success: false, message: "Module is required" }, { status: 400 });
    }

    const result = await listRecords(module, { limit: 10000 });
    let data = result?.data || [];

    // Apply filtering
    data = data.filter(item => {
      // Date Filtering
      const itemDate = item.date || item.month;
      if (start && item.date && item.date < start) return false;
      if (end && item.date && item.date > end) return false;
      
      // Customer Filtering
      if (customer && customer !== 'All') {
        if (item.customer !== customer && item.customerId !== customer) return false;
      }

      // Worker Filtering
      if (worker && worker !== 'All') {
        const itemWorker = item.worker || item.driver;
        if (itemWorker !== worker && item.workerId !== worker && item.driverId !== worker) return false;
      }

      // Vehicle Filtering
      if (vehicle && vehicle !== 'All') {
        if (item.vehicle !== vehicle && item.vehicleId !== vehicle) return false;
      }

      return true;
    });

    // Transform data for clean export
    const exportData = data.map(item => {
      const clean = { ...item };
      delete clean._id;
      delete clean.driverId;
      delete clean.workerId;
      delete clean.customerId;
      delete clean.vehicleId;
      delete clean.towId;
      return clean;
    });

    return NextResponse.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
