import type { Page } from "./types";
export const pageNames: Record<Page, string> = {
  overview: "Genel Bakış",
  transactions: "İşlemler",
  accounts: "Hesaplarım",
  categories: "Kategoriler",
  budgets: "Bütçeler",
  recurring: "Düzenli Ödemeler",
  reports: "Raporlar",
  settings: "Ayarlar",
};
export function isPage(value: string): value is Page {
  return value in pageNames;
}
