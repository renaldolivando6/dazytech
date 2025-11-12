/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',  // ⭐ PENTING: Generate static files
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;