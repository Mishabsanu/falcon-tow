import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Tow from '@/models/Tow';
import Customer from '@/models/Customer';
import Vehicle from '@/models/Vehicle';
import Salary from '@/models/Salary';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';
import Quotation from '@/models/Quotation';

export const runtime = 'nodejs';

// Fields to strip from all exports
const STRIP_FIELDS = ['_id', '__v', 'password', 'towData', 'customerData', 'workerData', 'vehicleData', 'driverData'];

// Clean column headers for each module
const MODULE_COLUMNS = {
  invoices: ['id', 'date', 'jobId', 'customer', 'worker', 'vehicle', 'type', 'total', 'paid', 'status', 'createdBy', 'createdAt'],
  tows: ['id', 'date', 'driver', 'vehicle', 'customer', 'customerVehicle', 'customerPlate', 'pickup', 'dropoff', 'paymentMethod', 'amount', 'driverShare', 'companyShare', 'status', 'createdBy', 'createdAt'],
  expenses: ['id', 'date', 'description', 'amount', 'worker', 'vehicle', 'createdBy', 'createdAt'],
  quotations: ['id', 'date', 'customer', 'driver', 'vehicle', 'pickup', 'dropoff', 'amount', 'status', 'createdBy', 'createdAt'],
  customers: ['id', 'name', 'email', 'phone', 'address', 'status', 'createdAt'],
  vehicles: ['id', 'name', 'plate', 'modelRef', 'year', 'engineRef', 'chassisRef', 'status', 'insuranceExpiry', 'registrationExpiry'],
  users: ['id', 'name', 'email', 'phone', 'role', 'salary', 'status'],
  salaries: ['id', 'month', 'year', 'worker', 'baseSalary', 'cashCollected', 'retention', 'cashDeduction90', 'expenses', 'amount', 'status', 'createdAt'],
};

const models = {
  users: User,
  tows: Tow,
  customers: Customer,
  vehicles: Vehicle,
  salaries: Salary,
  invoices: Invoice,
  expenses: Expense,
  quotations: Quotation,
};

function formatValue(key, value) {
  if (value === null || value === undefined) return '';
  // Format dates cleanly
  if (key === 'date' || key === 'createdAt') {
    const d = new Date(value);
    if (!isNaN(d)) return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return String(value);
}

function toCsvClean(records, columns) {
  const header = columns.join(',');
  const rows = records.map(record =>
    columns.map(col => {
      const val = formatValue(col, record[col]);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

export async function GET(_request, context) {
  try {
    await connectDB();
    const { module: moduleKey } = await context.params;
    const Model = models[moduleKey];

    if (!Model) {
      return Response.json({ error: 'Module not found' }, { status: 404 });
    }

    const records = await Model.find({}).sort({ createdAt: -1 }).limit(5000).lean();

    const columns = MODULE_COLUMNS[moduleKey] || 
      Object.keys(records[0] || {}).filter(k => !STRIP_FIELDS.includes(k));

    const csv = toCsvClean(records, columns);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${moduleKey}_export.csv"`,
      },
    });
  } catch (err) {
    console.error('[EXPORT_ERROR]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
