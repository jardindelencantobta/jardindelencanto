import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

const BASE = BRAND.url;
const LAST_MODIFIED = new Date("2026-09-25");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,                      lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/bodas`,                 lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/quince-anos`,           lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/eventos-empresariales`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/revelacion-de-genero`,  lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/blog`,                  lastModified: LAST_MODIFIED, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/politica-de-privacidad`, lastModified: new Date("2026-09-21"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
