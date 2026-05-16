import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: { typedRoutes: true },
  env: {
    NEXT_PUBLIC_AUTH_ENABLED: process.env.ADMIN_PASSWORD_HASH ? "1" : "",
  },
  // Allow `.js` import specifiers (the project uses `"type": "module"` ESM
  // conventions) to resolve to their corresponding `.ts`/`.tsx` source files
  // under webpack. Drive-by unblock for the production build; the chat
  // provider/tool modules from HOM-22/24 wrote `.js` specifiers that Next's
  // webpack does not resolve to TS by default.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default config;
