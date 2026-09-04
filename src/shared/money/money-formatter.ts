/**
 * Formats integer paise into an Indian Rupee string for UI display only.
 * e.g., 500050 -> "₹5,000.50"
 * e.g., 100 -> "₹1.00"
 * e.g., 0 -> "₹0.00"
 * 
 * Do NOT use the output of this function for backend financial calculations.
 */
export function formatPaiseToRupees(paise: number): string {
  if (isNaN(paise) || paise < 0) {
    return "₹0.00";
  }

  const rupees = paise / 100;
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
