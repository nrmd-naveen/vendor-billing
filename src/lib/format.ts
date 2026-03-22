/**
 * Format a number in Indian numbering system (e.g. 1,23,456.00)
 * @param n - the number to format
 * @param decimals - decimal places (default 0)
 */
export function fmtINR(n: number, decimals = 0): string {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
