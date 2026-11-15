import "server-only";
import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}
export function databaseError(error: {
  code?: string;
  message?: string;
}): string {
  if (error.message?.includes("RANGE_TOO_LARGE"))
    return "Bu aralıkta 10.000'den fazla işlem var. Daha kısa bir tarih aralığı seçin.";
  if (error.message?.includes("ALREADY_REALIZED"))
    return "Bu ödeme daha önce kaydedilmiş.";
  if (error.message?.includes("CATEGORY_ARCHIVED"))
    return "Kategori arşivlenmiş. Aktif bir kategori seçin.";
  if (error.code === "23503")
    return "Bu kayıt başka kayıtlara bağlı. Kategoriyi arşivleyebilir veya bağlı kayıtları düzenleyebilirsiniz.";
  if (error.code === "23505")
    return "Bu kayıt zaten mevcut. Kategori adı veya bütçe kapsamı benzersiz olmalı.";
  if (error.code === "23514" || error.message?.includes("INVALID_"))
    return "Bilgiler geçersiz. Tarih, tutar ve kategori türünü kontrol edin.";
  if (error.code === "42501")
    return "Bu işlem için yetkiniz yok. Yeniden giriş yapın.";
  return "İşlem tamamlanamadı. Bağlantıyı ve veritabanı kurulumunu kontrol edip tekrar deneyin.";
}
