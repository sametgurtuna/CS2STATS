import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "avatars.akamai.steamstatic.com",
      }
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // No org/project/authToken here on purpose — without SENTRY_AUTH_TOKEN this
  // just skips source map upload instead of failing the build. Set them (and
  // SENTRY_AUTH_TOKEN) later if/when source map upload is wanted.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
