export const moduleData = {
  customers: {
    title: 'Customer',
    listPath: '/dashboard/customers',
    nameField: 'name',
    records: [],
    fields: [
      { name: 'id', label: 'ID', type: 'text', hidden: true },
      { name: 'name', label: 'Full Name', type: 'text' },
      { name: 'email', label: 'Email Address', type: 'email' },
      { name: 'phone', label: 'Contact Number', type: 'tel' },
      { name: 'address', label: 'Street Address', type: 'text' },
      { name: 'status', label: 'Account Status', type: 'select', options: ['Active', 'Inactive'], hidden: true, defaultValue: 'Active' },
    ],
  },
  vehicles: {
    title: 'Vehicle',
    listPath: '/dashboard/vehicles',
    nameField: 'name',
    records: [],
    fields: [
      { name: 'id', label: 'ID', type: 'text', hidden: true },
      { name: 'name', label: 'Vehicle Name', type: 'text' },
      { name: 'plate', label: 'Plate Number', type: 'text' },
      { name: 'modelRef', label: 'Model Reference', type: 'text', required: false },
      { name: 'year', label: 'Year of Manufacture', type: 'text', required: false },
      { name: 'engineRef', label: 'Engine Reference', type: 'text', required: false },
      { name: 'chassisRef', label: 'Chassis Reference', type: 'text', required: false },
      { name: 'status', label: 'Operational Status', type: 'select', options: ['Available', 'In Use', 'Maintenance'], hidden: true, defaultValue: 'Available' },

      // Compliance Section
      { name: 'insuranceExpiry', label: 'Insurance Expiry Date', type: 'date', section: 'Compliance & Legal' },
      { name: 'registrationExpiry', label: 'Registration Expiry Date', type: 'date', section: 'Compliance & Legal' },
    ],
  },
  expenses: {
    title: 'Expense',
    listPath: '/dashboard/expenses',
    nameField: 'id',
    records: [],
    fields: [
      { name: 'id', label: 'ID', type: 'text', hidden: true },
      { name: 'date', label: 'Transaction Date', type: 'date', span: 6 },
      { name: 'amount', label: 'Amount (QAR)', type: 'number', span: 6 },
      { name: 'description', label: 'Description', type: 'text', span: 12 },
      { name: 'worker', label: 'Assigned Worker', type: 'select', module: 'users', span: 6 },
      { name: 'workerId', label: 'Worker Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'vehicle', label: 'Associated Vehicle', type: 'select', module: 'vehicles', span: 6 },
      { name: 'vehicleId', label: 'Vehicle Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'createdBy', label: 'Registered By', type: 'text', readOnly: true, section: 'Administrative Audit', hidden: true },
    ],
    joins: [
      { from: 'users', localField: 'workerId', foreignField: '_id', as: 'workerData' },
      { from: 'vehicles', localField: 'vehicleId', foreignField: '_id', as: 'vehicleData' },
    ]
  },
  invoices: {
    title: 'Invoice',
    listPath: '/dashboard/invoices',
    nameField: 'id',
    records: [],
    fields: [
      { name: 'id', label: 'ID', type: 'text', hidden: true },
      { name: 'customer', label: 'Billing Customer', type: 'select', module: 'customers', span: 4, section: 'Billing Entity' },
      { name: 'customerId', label: 'Customer Mongo ID', type: 'text', hidden: true },
      { name: 'customerMobile', label: 'Customer Mobile', type: 'text', span: 4, section: 'Billing Entity' },
      { name: 'customerAddress', label: 'Customer Address', type: 'text', span: 4, section: 'Billing Entity' },
      { name: 'date', label: 'Billing Date', type: 'date', span: 6, section: 'Financial Details' },
      { name: 'type', label: 'Payment Type', type: 'select', options: ['Cash', 'Card', 'Bank Transfer', 'Credit'], defaultValue: 'Credit', span: 6, section: 'Financial Details' },
      { name: 'total', label: 'Total Billed (QAR)', type: 'number', defaultValue: 0, span: 6, section: 'Financial Details', readOnly: true },
      { name: 'paid', label: 'Total Paid (QAR)', type: 'number', defaultValue: 0, span: 6, section: 'Financial Details' },
      { name: 'status', label: 'Payment Status', type: 'text', readOnly: true, defaultValue: 'Unpaid', hidden: true },
    ],
    joins: [
      { from: 'tows', localField: 'towId', foreignField: '_id', as: 'towData' },
      { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customerData' },
    ]
  },
  quotations: {
    title: 'Quotation',
    listPath: '/dashboard/quotations',
    nameField: 'id',
    records: [],
    fields: [
      { name: 'id', label: 'ID', type: 'text', hidden: true },
      { name: 'customer', label: 'Customer Name', type: 'select', module: 'customers', span: 4, section: 'Client & Logistics' },
      { name: 'customerId', label: 'Customer Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'customerVehicle', label: "Customer's Vehicle Name", type: 'text', span: 4, section: 'Client & Logistics' },
      { name: 'customerPlate', label: "Customer's Vehicle Plate Number", type: 'text', span: 4, section: 'Client & Logistics', required: false },
      
      { name: 'pickup', label: 'Pickup Location', type: 'text', span: 6, section: 'Client & Logistics' },
      { name: 'dropoff', label: 'Drop-off Location', type: 'text', span: 6, section: 'Client & Logistics' },
      
      { name: 'driver', label: 'Assigned Driver', type: 'select', module: 'users', span: 4, section: 'Quotation Details' },
      { name: 'driverId', label: 'Worker Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'vehicle', label: 'Operational Vehicle', type: 'select', module: 'vehicles', span: 4, section: 'Quotation Details' },
      { name: 'vehicleId', label: 'Vehicle Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'vehicleName', label: 'Vehicle Name', type: 'text', hidden: true, required: false },
      { name: 'vehiclePlate', label: 'Vehicle Plate', type: 'text', hidden: true, required: false },
      { name: 'date', label: 'Estimated Date', type: 'date', span: 4, section: 'Quotation Details' },
      
      { name: 'amount', label: 'Quoted Amount (QAR)', type: 'number', span: 6, section: 'Quotation Details' },
      { name: 'status', label: 'Quote Status', type: 'select', options: ['Draft', 'Sent', 'Approved', 'Cancelled', 'Rejected'], defaultValue: 'Draft', span: 6, section: 'Quotation Details' },
    ],
  },
  tows: {
    title: 'Tow Job',
    listPath: '/dashboard/tows',
    nameField: 'id',
    records: [],
    fields: [
      { name: 'id', label: 'ID', type: 'text', hidden: true },
      { name: 'date', label: 'Service Date', type: 'date', span: 4 },
      { name: 'driver', label: 'Worker', type: 'select', module: 'users', span: 4 },
      { name: 'driverId', label: 'Worker Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'vehicle', label: 'Operational Truck', type: 'select', module: 'vehicles', span: 4 },
      { name: 'vehicleId', label: 'Vehicle Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'vehicleName', label: 'Vehicle Name', type: 'text', hidden: true, required: false },
      { name: 'vehiclePlate', label: 'Vehicle Plate', type: 'text', hidden: true, required: false },
      { name: 'customer', label: 'Customer', type: 'select', module: 'customers', allowQuickAdd: true, span: 4, section: 'Towed Vehicle Details' },
      { name: 'customerPhone', label: 'Customer Phone', type: 'text', hidden: true },
      { name: 'customerVehicle', label: "Customer's Vehicle Name", type: 'text', span: 4, section: 'Towed Vehicle Details' },
      { name: 'customerPlate', label: "Customer's Vehicle Plate Number", type: 'text', span: 4, section: 'Towed Vehicle Details' },
      { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Cash', 'Credit'], defaultValue: 'Credit', span: 2, section: 'Financial Split' },
      { name: 'amount', label: 'Total Charges (QAR)', type: 'number', span: 2, section: 'Financial Split' },
      { name: 'serviceCommission', label: 'Hidden Charge', type: 'number', span: 2, defaultValue: 0, section: 'Financial Split', required: false },
      { name: 'driverShare', label: 'Driver (10%)', type: 'number', readOnly: true, span: 3, section: 'Financial Split' },
      { name: 'companyShare', label: 'Company (90%)', type: 'number', readOnly: true, span: 3, section: 'Financial Split' },


      { name: 'pickup', label: 'Pickup Address', type: 'text', span: 6, section: 'Service Path' },
      { name: 'dropoff', label: 'Drop-off Address', type: 'text', span: 6, section: 'Service Path' },

      { name: 'pickupPhoto', label: 'Pickup Proof', type: 'file', span: 6, section: 'Service Path', required: false },
      { name: 'dropoffPhoto', label: 'Drop-off Proof', type: 'file', span: 6, section: 'Service Path', required: false },
      { name: 'status', label: 'Job Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Closed'], defaultValue: 'Completed', hidden: true },
      { name: 'createdBy', label: 'Registered By', type: 'text', readOnly: true, section: 'Administrative Audit', hidden: true },
    ],
    joins: [
      { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customerData' },
      { from: 'users', localField: 'driverId', foreignField: '_id', as: 'driverData' },
      { from: 'vehicles', localField: 'vehicleId', foreignField: '_id', as: 'vehicleData' },
    ]
  },

  salaries: {
    title: 'Salary Payment',
    listPath: '/dashboard/salaries',
    nameField: 'id',
    records: [],
    fields: [
      { name: 'id', label: 'ID', type: 'text', hidden: true },
      { name: 'month', label: 'Payroll Month', type: 'select', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
      { name: 'year', label: 'Payroll Year', type: 'select', options: ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'] },
      { name: 'worker', label: 'Employee Name', type: 'select', module: 'users' },
      { name: 'workerId', label: 'Worker Mongo ID', type: 'text', hidden: true, required: false },
      { name: 'baseSalary', label: 'Monthly Base Salary (QAR)', type: 'number', readOnly: true, defaultValue: 0 },
      { name: 'cashCollected', label: 'Total Cash Revenue (QAR)', type: 'number', readOnly: true, defaultValue: 0 },
      { name: 'creditRevenue', label: 'Total Credit Revenue (QAR)', type: 'number', readOnly: true, defaultValue: 0 },
      { name: 'retention', label: 'Total Commission (10%)', type: 'number', readOnly: true, defaultValue: 0 },
      { name: 'cashDeduction90', label: 'Cash Deduction (90%)', type: 'number', readOnly: true, defaultValue: 0 },
      { name: 'expenses', label: 'Expense Deductions (QAR)', type: 'number', readOnly: true, defaultValue: 0 },
      { name: 'amount', label: 'Net Payable Amount (QAR)', type: 'number', readOnly: true, defaultValue: 0 },
      { name: 'status', label: 'Payment Status', type: 'select', options: ['Paid', 'Pending'], hidden: true, defaultValue: 'Pending' },
    ],
    joins: [
      { from: 'users', localField: 'workerId', foreignField: '_id', as: 'workerData' },
    ]
  },

  notifications: {
    title: 'Notification',
    listPath: '/dashboard/notifications',
    nameField: 'title',
    records: [],
    fields: [
      { name: 'title', label: 'Notification Title', type: 'text' },
      { name: 'message', label: 'Notification Message', type: 'text' },
      { name: 'time', label: 'Time Received', type: 'text' },
      { name: 'type', label: 'Category', type: 'select', options: ['tow', 'payment', 'alert', 'status'] },
      { name: 'unread', label: 'Is Unread?', type: 'select', options: ['true', 'false'] },
    ],
  },
  users: {
    title: 'User Management',
    listPath: '/dashboard/users',
    nameField: 'name',
    records: [
      { id: 'EMP-001', name: 'System Admin', password: 'admin123', email: 'admin@falcon.com', role: 'Administrator' }
    ],
    fields: [
      { name: 'id', label: 'Employee ID', type: 'text', hidden: true },
      { name: 'name', label: 'Full Name', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'email', label: 'Email Address', type: 'email', required: false },
      { name: 'phone', label: 'Mobile Number', type: 'tel' },
      { name: 'role', label: 'User Role', type: 'select', options: ['Administrator', 'Worker'] },
      { name: 'salary', label: 'Monthly Base Salary (QAR)', type: 'number' },
      { name: 'status', label: 'Employment Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'], hidden: true, defaultValue: 'Active' },
    ],
  },
};

export function getModuleRecord(moduleKey, id) {
  const config = moduleData[moduleKey];
  return config?.records.find((record) => record.id === id) ?? config?.records[0];
}
