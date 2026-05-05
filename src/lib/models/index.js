export const SCHEMAS = {
  users: {
    name: "String",
    email: "String (Unique)",
    password: "String (Hashed)",
    role: "Administrator | Worker",
    status: "Active | Inactive",
    salary: "Number"
  },
  tows: {
    id: "String (TOW-XXXX)",
    customer: "String",
    vehicle: "String",
    driver: "String",
    pickup: "String",
    dropoff: "String",
    amount: "Number",
    status: "Pending | In Progress | Completed",
    date: "Date String"
  },
  invoices: {
    id: "String (INV-XXXX)",
    jobId: "String",
    customer: "String",
    amount: "Number",
    status: "Paid | Unpaid",
    date: "Date String"
  },
  notifications: {
    title: "String",
    message: "String",
    type: "tow | payment | alert | status",
    unread: "Boolean",
    time: "String"
  }
};
