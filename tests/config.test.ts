import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseConfig } from "@/lib/supabase/config";

afterEach(() => vi.unstubAllEnvs());
describe("public Supabase configuration", () => {
  const set = (url: string, key: string) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
  };
  it("leaves missing credentials unconfigured", () => {
    set("", "");
    expect(supabaseConfig()).toBeNull();
  });
  it("accepts an HTTPS project and publishable key", () => {
    set("https://test.supabase.co", "sb_publishable_test");
    expect(supabaseConfig()?.url).toBe("https://test.supabase.co");
  });
  it("rejects secret keys before creating a browser client", () => {
    set("https://test.supabase.co", "sb_secret_NEVER_USE_THIS");
    expect(supabaseConfig()).toBeNull();
  });
  it("rejects legacy service-role JWTs", () => {
    const payload = Buffer.from(
      JSON.stringify({ role: "service_role" }),
    ).toString("base64url");
    set("https://test.supabase.co", `test.${payload}.test`);
    expect(supabaseConfig()).toBeNull();
  });
  it("accepts legacy anon JWTs", () => {
    const payload = Buffer.from(JSON.stringify({ role: "anon" })).toString(
      "base64url",
    );
    set("https://test.supabase.co", `test.${payload}.test`);
    expect(supabaseConfig()).not.toBeNull();
  });
  it("rejects external HTTP, malformed URLs and malformed keys", () => {
    set("http://example.com", "sb_publishable_test");
    expect(supabaseConfig()).toBeNull();
    set("bad-url", "sb_publishable_test");
    expect(supabaseConfig()).toBeNull();
    set("https://test.supabase.co", "invalid");
    expect(supabaseConfig()).toBeNull();
  });
});
