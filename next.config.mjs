/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config, { isServer }) {
    // Suppress known false-positive warnings from wallet SDK deps
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };

    // Suppress dynamic require warnings from ox/viem tempo chain
    config.ignoreWarnings = [
      { module: /virtualMasterPool/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
    ];

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
