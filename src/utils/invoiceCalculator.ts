export const calculateInvoiceTotals = (
  items: any[],
  laborCost: number,
  gstPercent: number,
  discount: number,
) => {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );

  const subtotal = itemsTotal + laborCost;

  const gstAmount = (subtotal * gstPercent) / 100;

  const grandTotal = subtotal + gstAmount - discount;

  return {
    subtotal,
    gstAmount,
    grandTotal,
  };
};
