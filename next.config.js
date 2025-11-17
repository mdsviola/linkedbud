/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "handlebars"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize handlebars for server-side to avoid webpack bundling issues
      config.externals = config.externals || [];
      config.externals.push("handlebars");
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
};

module.exports = nextConfig;
