import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalite Filo",
    short_name: "Kalite Filo",
    lang: "tr",
    start_url: "/",
    display: "browser",
    background_color: "#f8f9fb",
    theme_color: "#182136",
    icons: [
      {
        src: "/icons/kalite-filo-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
