import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-24e1e9e1d95440ceaca7278743c14e24.r2.dev" },
    ],
  },
};

export default withNextIntl(nextConfig);
