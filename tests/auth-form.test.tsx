// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { AuthForm } from "@/components/auth-form";

const { signUp, signInWithPassword, resend, replace, refresh } = vi.hoisted(
  () => ({
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    resend: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase/client", () => ({
  browserSupabase: () => ({ auth: { signUp, signInWithPassword, resend } }),
}));
vi.mock("@/lib/supabase/config", () => ({
  supabaseConfig: () => ({}),
  siteUrl: () => "https://example.com",
}));

const email = "test@example.com";
const password = "test-password-123";
async function submitForm(mode: "login" | "register") {
  const user = userEvent.setup();
  render(<AuthForm mode={mode} />);
  if (mode === "register")
    await user.type(screen.getByLabelText("Adın"), "Test");
  await user.type(screen.getByLabelText("E-posta adresi"), email);
  await user.type(
    screen.getByPlaceholderText(
      mode === "login" ? "Şifreni gir" : "En az 10 karakter",
    ),
    password,
  );
  await user.click(
    screen.getByRole("button", {
      name: mode === "login" ? "Giriş yap" : "Hesap oluştur",
    }),
  );
  return user;
}
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("kayıt ve giriş", () => {
  it("oturum oluştuğunda kullanıcıyı finans alanına yönlendirir", async () => {
    signUp.mockResolvedValue({ data: { session: {} }, error: null });
    await submitForm("register");
    expect(signUp).toHaveBeenCalledWith({
      email,
      password,
      options: {
        data: { name: "Test" },
        emailRedirectTo: "https://example.com/auth/callback",
      },
    });
    expect(replace).toHaveBeenCalledWith("/app/overview");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("doğrulama bekleyen kayıtta onay bilgisi gösterir", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    await submitForm("register");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "gelen kutunuzu",
    );
    expect(
      screen.getByRole("button", { name: /yeniden gönder/ }),
    ).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("posta kotası dolunca e-posta gönderildi demeden kullanıcıyı bilgilendirir", async () => {
    signUp.mockResolvedValue({
      data: { session: null },
      error: { code: "over_email_send_rate_limit", status: 429 },
    });
    await submitForm("register");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-posta gönderim sınırına",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hesap oluştur" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("onaylanmamış hesap girişte bağlantıyı açıkça isteyebilir, sonra giriş yapabilir", async () => {
    signInWithPassword
      .mockResolvedValueOnce({
        error: { code: "email_not_confirmed", status: 400 },
      })
      .mockResolvedValueOnce({ error: null });
    resend.mockResolvedValue({ error: null });
    const user = await submitForm("login");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "e-postanızı doğrulayın",
    );
    expect(resend).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /yeniden gönder/ }));
    expect(resend).toHaveBeenCalledWith({
      type: "signup",
      email,
      options: { emailRedirectTo: "https://example.com/auth/callback" },
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "yeni bir bağlantı",
    );
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));
    expect(replace).toHaveBeenCalledWith("/app/overview");
  });
});
