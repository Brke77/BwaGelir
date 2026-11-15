export function emailValidationMessage(email: string): string | null {
  if (email.toLocaleLowerCase("en-US").endsWith("@gmail.com.tr")) {
    return "Gmail adresleri genellikle @gmail.com ile biter. E-posta uzantınızı kontrol edin.";
  }
  return null;
}

export function signupErrorMessage(code?: string, status?: number): string {
  if (code === "email_address_invalid")
    return "E-posta adresi geçersiz. Adresi ve uzantısını kontrol edin.";
  if (code === "email_address_not_authorized")
    return "Bu e-posta adresine doğrulama mesajı gönderilemiyor. E-posta gönderim ayarlarını kontrol edin.";
  if (code === "user_already_exists")
    return "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.";
  if (code === "weak_password")
    return "Şifre güvenlik koşullarını karşılamıyor. Daha güçlü bir şifre seçin.";
  if (code === "over_email_send_rate_limit" || status === 429)
    return "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar deneyin.";
  return "Kayıt tamamlanamadı. Bilgileri kontrol edin veya biraz sonra tekrar deneyin.";
}
