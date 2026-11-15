"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { browserSupabase } from "@/lib/supabase/client";
import { emailValidationMessage, signupErrorMessage } from "@/lib/auth-errors";
import { supabaseConfig, siteUrl } from "@/lib/supabase/config";
import { Button } from "./ui/button";
import { Logo } from "./logo";

export type AuthMode = "login" | "register" | "forgot" | "reset";
const titles: Record<AuthMode, string> = {
  login: "Tekrar hoş geldin.",
  register: "Yeni bir başlangıç.",
  forgot: "Şifreni yenileyelim.",
  reset: "Yeni şifreni belirle.",
};
export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const configured = Boolean(supabaseConfig());
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setError("");
    setMessage("");
    if (mode !== "reset" && !z.email().safeParse(email).success) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (mode !== "reset") {
      const message = emailValidationMessage(email);
      if (message) {
        setError(message);
        return;
      }
    }
    if (
      ["register", "reset"].includes(mode) &&
      (password.length < 10 || password.length > 128)
    ) {
      setError("Şifreniz 10–128 karakter olmalı.");
      return;
    }
    setBusy(true);
    try {
      const supabase = browserSupabase();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error)
          throw new Error(
            "Giriş yapılamadı. E-posta, şifre ve e-posta doğrulamasını kontrol edin.",
          );
        router.replace("/app/overview");
        router.refresh();
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: String(form.get("name") ?? "")
                .trim()
                .slice(0, 80),
            },
            emailRedirectTo: `${siteUrl()}/auth/callback`,
          },
        });
        if (error)
          throw new Error(signupErrorMessage(error.code, error.status));
        if (data.session) {
          router.replace("/app/overview");
          router.refresh();
        } else
          setMessage(
            "Doğrulama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.",
          );
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
        });
        if (error)
          throw new Error("İstek gönderilemedi. Biraz sonra tekrar deneyin.");
        setMessage(
          "Bu adresle bir hesap varsa şifre sıfırlama bağlantısı gönderildi.",
        );
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error)
          throw new Error(
            "Şifre güncellenemedi. Yeni bir sıfırlama bağlantısı isteyin.",
          );
        router.replace("/app/overview");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bağlantı kurulamadı.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Link href="/" aria-label="Ana sayfa">
          <Logo light />
        </Link>
        <div>
          <span className="eyebrow">KÜÇÜK ADIMLAR. BÜYÜK BİR RAHATLIK.</span>
          <h1>
            Paranla arana
            <br />
            biraz netlik kat.
          </h1>
          <p>
            Bugününü takip et.
            <br />
            Yarınına yer aç.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="illustration-card">
              <span>DAHA DENGELİ BİR HAYAT</span>
              <svg viewBox="0 0 300 130">
                <path
                  d="M0 120 C40 118 38 95 70 100 S110 48 145 65 S190 50 208 32 S245 45 300 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <strong>Geleceğin, senin elinde.</strong>
            </div>
          </div>
        </div>
        <div className="auth-security">
          <ShieldCheck size={18} /> Verilerin sana özel. Kontrol her zaman
          sende.
        </div>
      </aside>
      <main className="auth-main">
        <Link href="/" className="auth-mobile-logo">
          <Logo />
        </Link>
        <div className="auth-box">
          <span className="eyebrow">KİŞİSEL FİNANS ALANIN</span>
          <h2>{titles[mode]}</h2>
          <p className="muted">
            {mode === "login"
              ? "Finansal hayatına kaldığın yerden devam et."
              : mode === "register"
                ? "Daha düzenli bir finansal hayat için ilk adımı at."
                : "Güvenli hesabına yeniden eriş."}
          </p>
          {!configured && (
            <div className="notice">
              <strong>Supabase bağlantısı bekleniyor.</strong>
              <p>
                Gerçek hesap kullanımı için .env.local dosyasını doldurun.
                Kurulum adımları README.md dosyasında. Şimdi örnek verilerle
                uygulamayı inceleyebilirsiniz.
              </p>
              <Link href="/demo" className="inline-link">
                Demoyu keşfet <ArrowRight size={15} />
              </Link>
            </div>
          )}
          {(error || params.get("error")) && (
            <p className="form-error" role="alert">
              {error ||
                "Bağlantı geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyin."}
            </p>
          )}
          {message ? (
            <div className="success-notice" role="status">
              {message}
              <Link href="/login">Giriş sayfasına dön</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              {mode === "register" && (
                <label>
                  Adın
                  <input
                    name="name"
                    placeholder="Ad Soyad"
                    autoComplete="name"
                    maxLength={80}
                    required
                  />
                </label>
              )}
              {mode !== "reset" && (
                <label>
                  E-posta adresi
                  <input
                    name="email"
                    type="email"
                    placeholder="sen@ornek.com"
                    autoComplete="email"
                    required
                    disabled={!configured}
                  />
                </label>
              )}
              {mode !== "forgot" && (
                <label>
                  Şifre
                  <div className="password-field">
                    <input
                      name="password"
                      type={visible ? "text" : "password"}
                      placeholder={
                        mode === "login" ? "Şifreni gir" : "En az 10 karakter"
                      }
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      minLength={mode === "login" ? 1 : 10}
                      maxLength={128}
                      required
                      disabled={!configured}
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              )}
              {mode === "login" && (
                <Link href="/forgot-password" className="forgot-link">
                  Şifremi unuttum
                </Link>
              )}
              <Button type="submit" disabled={busy || !configured}>
                {busy ? <Loader2 className="spin" size={17} /> : null}
                {mode === "login"
                  ? "Giriş yap"
                  : mode === "register"
                    ? "Hesap oluştur"
                    : mode === "forgot"
                      ? "Sıfırlama bağlantısı gönder"
                      : "Şifreyi güncelle"}
                <ArrowRight size={17} />
              </Button>
            </form>
          )}
          <p className="auth-switch">
            {mode === "login" ? (
              <>
                Henüz hesabın yok mu? <Link href="/register">Kayıt ol</Link>
              </>
            ) : (
              <Link href="/login">Giriş sayfasına dön</Link>
            )}
          </p>
          <div className="auth-divider">
            <span>önce tanışalım</span>
          </div>
          <Link className="button button-secondary auth-demo" href="/demo">
            Örnek verilerle keşfet <ArrowRight size={17} />
          </Link>
          <p className="auth-footnote">
            Banka bağlantısı veya kart bilgisi gerekmez.
          </p>
        </div>
      </main>
    </div>
  );
}
