export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {},
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Firebase Admin requires Node.js APIs - handle properly
    if (isServer) {
      // Externalize firebase and related packages for server
      const externals: Record<string, string> = {};
      ['firebase-admin', 'firebase', '@google-cloud/firestore', '@google-cloud/storage',
       'google-gax', 'grpc', '@grpc/grpc-js', 'firebase-database-compat', '@firebase/database-compat'
      ].forEach(mod => {
        externals[mod] = mod;
      });
      config.externals = [...(config.externals || []), externals];
    } else {
      // Client-side: don't bundle Firebase
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'firebase-admin': false,
        firebase: false,
        'firebase-database-compat': false,
        '@firebase/database-compat': false,
      };
    }
    return config;
  },
};
