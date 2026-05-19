import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    const privateHeaders = [
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; form-action 'self'; base-uri 'self'" },
    ];

    return [
      {
        source: "/inner-circle/:path*",
        headers: privateHeaders,
      },
      {
        source: "/api/inner-circle/:path*",
        headers: privateHeaders,
      },
    ];
  },
};

export default nextConfig;
