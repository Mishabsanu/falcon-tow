/**
 * Pure Business Logic for Tow Operations
 * These functions are independent of UI and API.
 */

export const calculateTowShares = (totalAmount) => {
  const amount = Number(totalAmount) || 0;
  
  // Rule: Driver gets 10%, Company gets 90%
  const driverShare = amount * 0.10;
  const companyShare = amount * 0.90;
  
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
