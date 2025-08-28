/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    domains: ['www.auxiliadorapay.shop'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.auxiliadorapay.shop',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    AUXILIADORA_API_BASE_URL: process.env.AUXILIADORA_API_BASE_URL || 'https://www.auxiliadorapay.shop/api',
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configurações customizadas do webpack se necessário
    return config;
  },
  // Configurações de performance
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  // Configurações de build
  swcMinify: true,
  // Configurações para resolver problemas RSC
  experimental: {
    serverComponentsExternalPackages: [],
    forceSwcTransforms: true,
  },
  // Desabilitar fast refresh para resolver problemas RSC
  reactStrictMode: false,
  // Configurações de webpack para resolver problemas RSC
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Desabilitar fast refresh em desenvolvimento
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;