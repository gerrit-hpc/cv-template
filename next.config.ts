import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: { typedRoutes: true },
  env: {
    NEXT_PUBLIC_AUTH_ENABLED: process.env.ADMIN_PASSWORD_HASH ? "1" : "",
  },
};

export default config;
