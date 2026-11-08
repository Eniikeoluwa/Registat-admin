/** Format integer minor units without rounding large dashboard totals through Number. */
export function money(amount: number | string, currency = "USD") {
  let minor: bigint;
  try { minor = BigInt(amount); } catch { return "Amount unavailable"; }
  const negative = minor < BigInt(0); const absolute = negative ? -minor : minor;
  const fraction = String(absolute % BigInt(100)).padStart(2, "0");
  try {
    const formatter = new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (negative ? "−" : "") + formatter.formatToParts(absolute / BigInt(100)).map(part => part.type === "fraction" ? fraction : part.value).join("");
  } catch {
    return `${negative ? "−" : ""}${currency} ${absolute / BigInt(100)}.${fraction}`;
  }
}
