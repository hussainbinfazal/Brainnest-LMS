/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img-c.udemycdn.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'cms-images.udemycdn.com',
      },
      {
        protocol: 'https',
        hostname: 'cms-images.udemycdn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Optional: Add image domains for next/image optimization
  // images: {
  //   domains: ['res.cloudinary.com','img-c.udemycdn.com','img.clerk.com','cms-images.udemycdn.com','images.unsplash.com','plus.unsplash.com'],
  //   unoptimized: false,
  //   dangerouslyAllowSVG: true,
  //   contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  // },
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
