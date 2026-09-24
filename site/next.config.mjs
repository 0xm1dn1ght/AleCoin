/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/AleCoin",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
