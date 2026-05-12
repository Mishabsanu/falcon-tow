export const calculateSalarySettlement = ({
  cashAmount = 0,
  creditAmount = 0,
  baseSalary = 0,
  expenses = 0
}) => {
  const cash = Number(cashAmount) || 0;
  const credit = Number(creditAmount) || 0;
  const totalRevenue = cash + credit;
  const salary = Number(baseSalary) || 0;
  const exp = Number(expenses) || 0;

  // 1. Calculate Commission (10% of ALL revenue)
  const workerCommission = totalRevenue * 0.10;
  
  // 2. Calculate what the worker already has (Cash)
  // 3. Calculate what is owed: Base Salary + Commission - Cash - Expenses
  const netPayout = salary + workerCommission - cash - exp;

  // For the company's profit perspective:
  // Company gets 90% of revenue - (Base Salary + Expenses)
  // Or: Revenue - (Base Salary + Commission + Expenses)
  const companyProfit = totalRevenue - (salary + workerCommission + exp);

  return {
    totalRevenue,
    cashAmount: cash,
    creditAmount: credit,
    workerCommission: Math.round(workerCommission * 100) / 100,
    baseSalary: salary,
    expenses: exp,
    netPayout: Math.round(netPayout * 100) / 100,
    companyProfit: Math.round(companyProfit * 100) / 100,
    totalWorkerEntitlement: salary + workerCommission // Total they should have earned
  };
};
