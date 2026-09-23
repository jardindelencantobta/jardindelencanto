import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/admin/", "/editor/", "/login", "/api/"],
    },
    sitemap: `${BRAND.url}/sitemap.xml`,
  };
}
