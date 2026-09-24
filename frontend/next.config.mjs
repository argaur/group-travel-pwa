import withPWA from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const withPWAAndConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);

// Sentry build-time config (source maps, tunneling). Disabled entirely when
// no DSN is set, same posture as the backend — no-op, not a broken build.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(withPWAAndConfig, {
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : withPWAAndConfig;
