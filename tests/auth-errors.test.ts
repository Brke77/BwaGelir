import { describe, expect, it } from "vitest";
import {
  callbackErrorMessage,
  emailValidationMessage,
  loginErrorMessage,
  signupErrorMessage,
} from "@/lib/auth-errors";

describe("kayıt hataları", () => {
  it("gmail.com.tr yazım hatasını açıklar", () => {
    expect(emailValidationMessage("ornek@GMAIL.COM.TR")).toContain(
      "@gmail.com",
    );
    expect(emailValidationMessage("ornek@gmail.com")).toBeNull();
    expect(emailValidationMessage("ornek@ornek.com.tr")).toBeNull();
  });
  it("Supabase hata kodlarını anlaşılır şekilde gösterir", () => {
    expect(signupErrorMessage("email_address_invalid", 400)).toContain(
      "geçersiz",
    );
    expect(signupErrorMessage("over_email_send_rate_limit", 429)).toContain(
      "bekleyip",
    );
    expect(signupErrorMessage("unexpected_failure", 500)).toContain(
      "Kayıt tamamlanamadı",
    );
    expect(signupErrorMessage("email_address_not_authorized", 403)).toContain(
      "Site yöneticisi",
    );
    expect(signupErrorMessage(undefined, 429)).toContain("Çok fazla istek");
    expect(loginErrorMessage("invalid_credentials", 400)).toContain(
      "şifre hatalı",
    );
  });
  it("doğrulama ve sıfırlama bağlantılarını başka tarayıcıda açanları yönlendirir", () => {
    expect(callbackErrorMessage("confirmation_browser")).toContain(
      "giriş yapmayı deneyin",
    );
    expect(callbackErrorMessage("recovery_browser")).toContain(
      "aynı tarayıcıda",
    );
    expect(callbackErrorMessage("link")).toContain("geçersiz");
    expect(callbackErrorMessage(null)).toBeNull();
  });
});
