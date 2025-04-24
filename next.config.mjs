/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://kryioldnasxqiafrbyzs.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeWlvbGRuYXN4cWlhZnJieXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDU5MzksImV4cCI6MjA2MDc4MTkzOX0.IvUvvVR3Jk2HyV7SONGLciLGAScOtV76YrIMPBtPwig"
  },
  // Ensure we don't generate any files for the (protected) route that was removed
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Clean up previous build artifacts
  cleanDistDir: true,
  // Disable build indicator to avoid extra requests
  devIndicators: {
    buildActivity: false,
  },
  poweredByHeader: false
}

export default nextConfig
