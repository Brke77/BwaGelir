import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  serverSupabase: async () => ({ auth }),
}));

const origin = "https://kasaflow.example";

async function callback(query: string) {
  const response = await GET(new Request(`${origin}/auth/callback?${query}`));
  expect(response.status).toBe(307);
  return response.headers.get("location");
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", origin);
  auth.exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
  auth.verifyOtp.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

it("opens the dashboard after exchanging a signup confirmation code", async () => {
  expect(await callback("code=signup-code")).toBe(`${origin}/app/overview`);
  expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("signup-code");
});

it("opens the password form after exchanging a recovery code", async () => {
  expect(await callback("code=recovery-code&next=/reset-password")).toBe(
    `${origin}/reset-password`,
  );
});

it.each([
  ["code=signup-code", "/login?error=confirmation_browser"],
  [
    "code=recovery-code&next=/reset-password",
    "/forgot-password?error=recovery_browser",
  ],
])(
  "directs the user to the correct form if %s lacks its verifier",
  async (query, path) => {
    auth.exchangeCodeForSession.mockResolvedValue({
      error: { code: "pkce_code_verifier_not_found" },
    });
    expect(await callback(query)).toBe(`${origin}${path}`);
  },
);

it("keeps the expired-link message when Supabase rejects the code", async () => {
  auth.exchangeCodeForSession.mockResolvedValue({
    error: { code: "flow_state_expired" },
  });
  expect(await callback("code=expired")).toBe(`${origin}/login?error=link`);
});

it.each([
  ["email", "/app/overview"],
  ["signup", "/app/overview"],
  ["recovery", "/reset-password"],
])(
  "verifies a %s token hash without the originating browser",
  async (type, path) => {
    expect(await callback(`type=${type}&token_hash=example-token`)).toBe(
      `${origin}${path}`,
    );
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      type,
      token_hash: "example-token",
    });
  },
);
