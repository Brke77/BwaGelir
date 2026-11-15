import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} – Kişisel Finans`,
    short_name: brand.name,
    description: "Gelir, gider ve bütçene daha net bir bakış.",
    start_url: "/app/overview",
    display: "standalone",
    background_color: "#f6f7f3",
    theme_color: "#526b43",
    lang: "tr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
