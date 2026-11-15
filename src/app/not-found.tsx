import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone-message">
      <span className="eyebrow">404</span>
      <h1>Bu sayfa bulunamadı.</h1>
      <p className="muted">Adresi kontrol edin veya başlangıca dönün.</p>
      <Link href="/" className="button button-primary">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
