/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cck.edu.pk',
      },
      {
        protocol: 'https',
        hostname: 'static.where-e.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'nzjkpawxqqomdtmihdln.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;

