// Format exact base units without converting a potentially large bigint to Number.
export function formatAmount(raw: bigint, decimals: number): string {
  const sign = raw < 0n ? "−" : "";
  const digits = (raw < 0n ? -raw : raw).toString().padStart(decimals + 1, "0");
  if (decimals === 0) return sign + digits;
  return `${sign}${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`;
}
