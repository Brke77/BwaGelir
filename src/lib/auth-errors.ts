export function emailValidationMessage(email: string): string | null {
  if (email.toLocaleLowerCase("en-US").endsWith("@gmail.com.tr")) {
    return "Gmail adresleri genellikle @gmail.com ile biter. E-posta uzantınızı kontrol edin.";
  }
  return null;
}

function authServiceMessage(code?: string, status?: number): string | null {
  if (code === "over_email_send_rate_limit")
    return "E-posta gönderim sınırına ulaşıldı. Bir süre bekleyip yeniden deneyin.";
  if (code === "over_request_rate_limit" || status === 429)
    return "Çok fazla istek gönderildi. Bir süre bekleyip yeniden deneyin.";
  if (code === "email_address_not_authorized")
    return "Doğrulama hizmeti şu anda bu adrese e-posta gönderemiyor. Site yöneticisiyle iletişime geçin.";
  if (code === "email_provider_disabled" || code === "signup_disabled")
    return "Bu işlem şu anda kullanıma kapalı. Site yöneticisiyle iletişime geçin.";
  return null;
}

export function signupErrorMessage(code?: string, status?: number): string {
  const serviceMessage = authServiceMessage(code, status);
  if (serviceMessage) return serviceMessage;
  if (code === "email_address_invalid")
    return "E-posta adresi geçersiz. Adresi ve uzantısını kontrol edin.";
  if (code === "user_already_exists" || code === "email_exists")
    return "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.";
  if (code === "weak_password")
    return "Şifre güvenlik koşullarını karşılamıyor. Daha güçlü bir şifre seçin.";
  return "Kayıt tamamlanamadı. Biraz sonra tekrar deneyin.";
}

export function loginErrorMessage(code?: string, status?: number): string {
  if (code === "email_not_confirmed")
    return "Hesabınıza giriş yapmak için e-postanızı doğrulayın. Gelen kutunuzu ve spam klasörünü kontrol edin.";
  if (code === "invalid_credentials")
    return "E-posta adresi veya şifre hatalı.";
  return (
    authServiceMessage(code, status) ??
    "Giriş yapılamadı. Biraz sonra tekrar deneyin."
  );
}

export function emailRequestErrorMessage(
  code?: string,
  status?: number,
): string {
  return (
    authServiceMessage(code, status) ??
    "Bağlantı gönderilemedi. Biraz sonra tekrar deneyin."
  );
}

export function callbackErrorMessage(reason: string | null): string | null {
  if (!reason) return null;
  if (reason === "confirmation_browser")
    return "Bu tarayıcıda doğrulama işlemi başlatılmamış veya tarayıcı verileri temizlenmiş. E-posta adresiniz ve şifrenizle giriş yapmayı deneyin.";
  if (reason === "recovery_browser")
    return "Bu tarayıcıdan yeni bir sıfırlama bağlantısı isteyin ve bağlantıyı aynı tarayıcıda açın.";
  return "Bağlantı geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyin.";
}
