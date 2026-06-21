/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // ComfyUI local output
      { protocol: "http", hostname: "localhost", port: "8188" },
      { protocol: "http", hostname: "127.0.0.1", port: "8188" },
      // Allow any https remote (catalog images, CDN). Tighten in prod.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
