"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-message">
      <h1>Bir şeyler ters gitti.</h1>
      <p className="muted">
        Sayfayı yeniden yükleyerek tekrar deneyebilirsiniz.
      </p>
      <Button onClick={reset}>Tekrar dene</Button>
    </main>
  );
}
