import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: "https", hostname: "pub-24e1e9e1d95440ceaca7278743c14e24.r2.dev" },
      { protocol: "https", hostname: "cdn.togttrading.com" },
      // Package images are uploaded from the dashboard and may land on any
      // https host (R2 dev URL, custom CDN, pasted URLs). The card renders them
      // as CSS backgrounds, so the modal gallery must accept them too or the
      // next/image optimizer returns 400 and shows a broken image.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default withNextIntl(nextConfig);
