"use client";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    queueMicrotask(update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div hidden={online} className="offline-banner" role="status">
        <WifiOff size={16} /> İnternet bağlantınız yok. Değişiklikler
        kaydedilemez.
      </div>
      {children}
    </ThemeProvider>
  );
}
