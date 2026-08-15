/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure all routes, including admin, are processed correctly
  // This helps prevent 404 errors in production
  output: 'standalone',
  
  // Enable proper CSS loading and processing
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // NOTE: secrets are NOT inlined here. DATABASE_URL, SECRET_COOKIE_PASSWORD and
  // CRON_SECRET are read from the environment at runtime (from .env.local locally,
  // and from the Vercel project settings in production). Never hardcode them.

  // Allow middleware to handle admin authorization
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
