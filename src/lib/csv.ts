import type { Transaction, Workspace } from "./types";
import { moneyInput } from "./money";

/** Excel formula injection prevention; every cell is quoted and escaped. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function transactionsCsv(
  transactions: Transaction[],
  data: Workspace,
): string {
  const rows = [
    [
      "Tarih",
      "İşlem adı",
      "Tür",
      "Tutar (TL)",
      "Kategori",
      "Hesap",
      "Hedef hesap",
      "Açıklama",
    ],
    ...transactions.map((t) => [
      t.date,
      t.name,
      t.kind === "income"
        ? "Gelir"
        : t.kind === "expense"
          ? "Gider"
          : "Transfer",
      moneyInput(t.amount),
      data.categories.find((c) => c.id === t.category_id)?.name ?? "",
      data.accounts.find((a) => a.id === t.account_id)?.name ?? "",
      data.accounts.find((a) => a.id === t.to_account_id)?.name ?? "",
      t.description,
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
