/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/AleCoin",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
