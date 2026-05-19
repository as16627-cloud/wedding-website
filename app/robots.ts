import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/inner-circle",
          "/api/private-planning",
          "/guest-list",
          "/inner-circle",
          "/private-planning",
          "/rsvp",
        ],
      },
    ],
    sitemap: "https://sumi-adi-knot-ready.com/sitemap.xml",
  };
}
