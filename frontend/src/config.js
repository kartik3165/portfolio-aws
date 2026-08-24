// Global variables for site links — change once here via .env
// VITE_SITE_URL: canonical site base (used for share links, SEO)
// VITE_IMG_BASE_URL: R2 / CDN base for uploaded images (also seen as VITE_R2_PUBLIC_BASE_URL for backwards compat)

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://example.com").replace(/\/$/, "");
export const IMG_BASE_URL = (
  import.meta.env.VITE_IMG_BASE_URL ||
  import.meta.env.VITE_R2_PUBLIC_BASE_URL ||
  "https://img.example.com"
).replace(/\/$/, "");
