import { brand } from "@/lib/brand";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={"logo" + (light ? " logo-light" : "")}>
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5 17V9a4 4 0 0 1 4-4h2v12H5Zm8 2V7h2a4 4 0 0 1 4 4v8h-6Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {brand.name}
      <span className="logo-dot">.</span>
    </span>
  );
}
