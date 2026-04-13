import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-04-13"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date("2026-04-13"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/features`,
      lastModified: new Date("2026-04-13"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
