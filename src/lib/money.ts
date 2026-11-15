export const MAX_MONEY = 100_000_000_000;

/** Accept Turkish amounts without passing decimal amounts through floating point. */
export function parseMoney(
  input: string,
  allowZero = false,
  allowNegative = false,
): number {
  let value = input
    .trim()
    .replace(/\s/g, "")
    .replace(/(?:TL|TRY|₺)$/i, "");
  const negative = value.startsWith("-");
  if (negative) value = value.slice(1);
  if (negative && !allowNegative) throw new Error("Tutar negatif olamaz.");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) {
    throw new Error(
      "Tutarı 1.250,50 biçiminde girin (en fazla iki kuruş hanesi).",
    );
  }
  const [whole, fraction = ""] = value.replaceAll(".", "").split(",");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > BigInt(MAX_MONEY))
    throw new Error("Tutar en fazla 1 milyar TL olabilir.");
  if (!allowZero && cents === 0n)
    throw new Error("Tutar sıfırdan büyük olmalı.");
  return Number(cents) * (negative ? -1 : 1);
}
export function sumMoney(values: number[]): number {
  const result = values.reduce((sum, v) => {
    if (!Number.isSafeInteger(v)) throw new Error("Geçersiz para değeri.");
    return sum + BigInt(v);
  }, 0n);
  if (
    result > BigInt(Number.MAX_SAFE_INTEGER) ||
    result < BigInt(Number.MIN_SAFE_INTEGER)
  )
    throw new Error("Toplam tutar güvenli hesaplama sınırını aşıyor.");
  return Number(result);
}
export function money(value: number, compact = false): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(value / 100);
}
export function moneyInput(value: number): string {
  return (value / 100).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}
export const percent = (value: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(value) +
  "%";
