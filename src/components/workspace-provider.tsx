"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import { createDemo, mutateDemo } from "@/lib/demo";
import { getRange } from "@/lib/dates";
import { emptyWorkspace, type DateRange, type Workspace } from "@/lib/types";
import type { Mutation } from "@/lib/validation";
import { Check, CircleAlert, X } from "lucide-react";

const DEMO_KEY = "kasaflow-demo-v1";
async function readWorkspace(
  demo: boolean,
  range: DateRange,
): Promise<Workspace> {
  if (demo) {
    const stored = localStorage.getItem(DEMO_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Workspace;
        if (
          Array.isArray(parsed.transactions) &&
          Array.isArray(parsed.accounts) &&
          Array.isArray(parsed.categories) &&
          parsed.preferences &&
          Array.isArray(parsed.recurring_occurrences) &&
          Array.isArray(parsed.budgets) &&
          Array.isArray(parsed.recurring_rules)
        )
          return parsed;
      } catch {
        localStorage.removeItem(DEMO_KEY);
      }
    }
    return createDemo();
  }
  const response = await fetch(
    `/api/workspace?start=${range.start}&end=${range.end}`,
    { cache: "no-store" },
  );
  const value = (await response.json()) as Workspace & { error?: string };
  if (!response.ok) throw new Error(value.error ?? "Veriler yüklenemedi.");
  return value;
}
interface WorkspaceContextValue {
  data: Workspace;
  demo: boolean;
  loading: boolean;
  busy: boolean;
  error: string;
  range: DateRange;
  setRange: (range: DateRange) => void;
  mutate: (mutation: Mutation) => Promise<boolean>;
  refresh: () => Promise<void>;
  notify: (text: string, error?: boolean) => void;
  resetDemo: () => void;
}
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("WorkspaceProvider gerekli.");
  return context;
}

export function WorkspaceProvider({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<Workspace>(emptyWorkspace);
  const dataRef = useRef(data);
  const [range, setRange] = useState(getRange("Bu ay"));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setTheme } = useTheme();
  const profileThemeApplied = useRef(false);
  const sequence = useRef(0);
  const notify = useCallback((text: string, error = false) => {
    setToast({ text, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5500);
  }, []);
  const replace = useCallback((value: Workspace) => {
    dataRef.current = value;
    setData(value);
  }, []);
  const refresh = useCallback(async () => {
    const seq = ++sequence.current;
    try {
      const value = await readWorkspace(demo, range);
      if (seq === sequence.current) {
        replace(value);
        setError("");
      }
    } catch (e) {
      if (seq === sequence.current)
        setError(e instanceof Error ? e.message : "Veriler yüklenemedi.");
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }, [demo, range, replace]);
  useEffect(() => {
    let active = true;
    const seq = ++sequence.current;
    void readWorkspace(demo, range).then(
      (value) => {
        if (active && seq === sequence.current) {
          replace(value);
          if (!demo && !profileThemeApplied.current) {
            setTheme(value.preferences.theme);
            profileThemeApplied.current = true;
          }
          setError("");
          setLoading(false);
        }
      },
      (e) => {
        if (active && seq === sequence.current) {
          setError(e instanceof Error ? e.message : "Veriler yüklenemedi.");
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [demo, range, replace, setTheme]);
  useEffect(() => {
    const onFocus = () => {
      if (!lock.current && !demo) {
        setLoading(true);
        void refresh();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh, demo]);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const mutate = useCallback(
    async (mutation: Mutation) => {
      if (lock.current) return false;
      if (!navigator.onLine && !demo) {
        notify("İnternet bağlantınız yok. İşlem kaydedilmedi.", true);
        return false;
      }
      lock.current = true;
      setBusy(true);
      try {
        if (demo) {
          const value = mutateDemo(dataRef.current, mutation);
          // Persist first: storage failures must never look like successful saves.
          localStorage.setItem(DEMO_KEY, JSON.stringify(value));
          replace(value);
        } else {
          const response = await fetch("/api/mutate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mutation),
          });
          const result = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(result.error ?? "Kayıt başarısız.");
          setLoading(true);
          await refresh();
        }
        if (mutation.entity === "preferences") setTheme(mutation.data.theme);
        notify(
          mutation.entity === "delete"
            ? "Kayıt silindi."
            : "Değişiklikler kaydedildi.",
        );
        return true;
      } catch (e) {
        notify(
          e instanceof TypeError
            ? "Bağlantı kesildi. Kaydı kontrol etmek için sayfayı yenileyin."
            : e instanceof DOMException
              ? "Demo kaydedilemedi. Tarayıcı depolamasını kontrol edin."
              : e instanceof Error
                ? e.message
                : "İşlem kaydedilemedi.",
          true,
        );
        return false;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [demo, notify, refresh, replace, setTheme],
  );
  const resetDemo = () => {
    try {
      const value = createDemo();
      localStorage.setItem(DEMO_KEY, JSON.stringify(value));
      replace(value);
      notify("Demo başlangıç durumuna getirildi.");
    } catch {
      notify("Tarayıcı depolama alanı kullanılamıyor.", true);
    }
  };
  return (
    <WorkspaceContext.Provider
      value={{
        data,
        demo,
        loading,
        busy,
        error,
        range,
        setRange: (value) => {
          if (value.start !== range.start || value.end !== range.end) {
            setLoading(true);
            setRange(value);
          }
        },
        mutate,
        refresh: async () => {
          setLoading(true);
          await refresh();
        },
        notify,
        resetDemo,
      }}
    >
      {children}
      {toast && (
        <div
          className={"toast" + (toast.error ? " toast-error" : "")}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <CircleAlert size={19} /> : <Check size={19} />}
          <span>{toast.text}</span>
          <button aria-label="Bildirimi kapat" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
