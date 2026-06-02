import { NextResponse } from "next/server";
import { listRecords } from "@/lib/store";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleKey = searchParams.get("module");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const customer = searchParams.get("customer");
    const worker = searchParams.get("worker");
    const vehicle = searchParams.get("vehicle");

    if (!moduleKey) {
      return NextResponse.json({ success: false, message: "Module is required" }, { status: 400 });
    }

    const result = await listRecords(moduleKey, { limit: 10000 });
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

    // Format Date utility
    const formatDate = (val) => {
      if (!val) return "";
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Transform data for clean export
    const exportData = data.map(item => {
      const clean = { ...item };
      
      // Specifically delete system metadata, internal IDs, and relational subdocuments
      const excludeKeys = [
        '_id', '__v', 'createdById', 'createdAt',
        'driverId', 'workerId', 'customerId', 'vehicleId', 'towId',
        'workerData', 'vehicleData', 'customerData', 'driverData',
        'towDetails', 'jobs', 'password', 'confirmPassword',
        'invoicePayments', 'commissionPayments'
      ];
      
      excludeKeys.forEach(k => delete clean[k]);

      // Format Date fields and strip remaining nested objects/arrays to prevent [object Object]
      Object.keys(clean).forEach(key => {
        const val = clean[key];
        const isDateKey = key.toLowerCase().includes('date');
        
        if (isDateKey && val) {
          clean[key] = formatDate(val);
        } else if (val instanceof Date) {
          clean[key] = formatDate(val);
        } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          clean[key] = formatDate(val);
        } else if (typeof val === 'object' && val !== null) {
          delete clean[key];
        }
      });

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
