/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  distDir: 'dist',
  poweredByHeader: false,
  
  // Add a rewrite rule to handle API requests
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000/api/:path*'
          : '/api/:path*',
      },
    ];
  },
  
  // Configure public asset directory
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
};

module.exports = nextConfig;