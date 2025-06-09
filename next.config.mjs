/** @type {import('next').NextConfig} */
const nextConfig = {

  // Optional: Add image domains for next/image optimization
  images: {
    domains: ['res.cloudinary.com','img-c.udemycdn.com','img.clerk.com'],
  },
   webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix for react-pdf and canvas issues
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Handle PDF.js worker
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Ignore canvas module for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }

    return config;
  },

};

export default nextConfig;
