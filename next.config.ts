import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).host : undefined;

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: SUPABASE_HOST ? [{ protocol: "https", hostname: SUPABASE_HOST }] : [],
    // or: domains: SUPABASE_HOST ? [SUPABASE_HOST] : [],
  },
};

export default nextConfig;
