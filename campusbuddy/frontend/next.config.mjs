/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // typedRoutes: true,
    // Keep native/server-only deps out of the bundler so their engine binaries
    // (the Prisma query engine) and node built-ins survive into the serverless
    // functions on Vercel instead of being tree-shaken or mis-bundled.
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'web-push'],
  },
};

export default nextConfig;
