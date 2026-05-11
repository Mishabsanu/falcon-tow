/**
 * Pure Business Logic for Tow Operations
 * These functions are independent of UI and API.
 */

export const calculateTowShares = (totalAmount, serviceCommission = 0) => {
  const total = Number(totalAmount) || 0;
  const commission = Number(serviceCommission) || 0;
  
  // Rule: Actual price is total minus commission (Hidden Charge)
  const actualPrice = Math.max(0, total - commission);
  
  // Rule: Driver gets 10% of Actual Price, Company gets 90%
  const driverShare = actualPrice * 0.10;
  const companyShare = actualPrice * 0.90;
  
  return {
    driverShare: Math.round(driverShare * 100) / 100,
    companyShare: Math.round(companyShare * 100) / 100
  };
};

export const validateTowStatusTransition = (currentStatus, nextStatus) => {
  const transitions = {
    'Pending': ['In Progress', 'Cancelled'],
    'In Progress': ['Completed', 'Cancelled'],
    'Completed': [], // Final state
    'Cancelled': []  // Final state
  };
  
  return transitions[currentStatus]?.includes(nextStatus) || false;
};
