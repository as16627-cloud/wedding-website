import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://sumi-adi-knot-ready.com",
      lastModified: new Date("2026-05-19T00:00:00.000+08:00"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
