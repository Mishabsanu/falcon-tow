/**
 * Pure Business Logic for Salary Settlements
 * Formula: Final Settlement = Company 90% Total - (Base Salary + Expenses + Worker 10% Total)
 */

export const calculateSalarySettlement = ({
  totalTowAmount = 0,
  baseSalary = 0,
  expenses = 0
}) => {
  const amount = Number(totalTowAmount) || 0;
  const salary = Number(baseSalary) || 0;
  const exp = Number(expenses) || 0;

  // 1. Calculate Shares
  const company90Share = amount * 0.90;
  const worker10Share = amount * 0.10;

  // 2. Apply Formula: Final Settlement = Company 90% Total - (Salary + Expenses + Worker 10% Total)
  // This calculates what the Company actually "keeps" as profit after paying the worker
  const finalSettlement = company90Share - (salary + exp + worker10Share);

  return {
    totalTowAmount: amount,
    company90Share: Math.round(company90Share * 100) / 100,
    worker10Share: Math.round(worker10Share * 100) / 100,
    baseSalary: salary,
    expenses: exp,
    finalSettlement: Math.round(finalSettlement * 100) / 100,
    netPayToWorker: salary + worker10Share // Amount the worker actually receives
  };
};
