/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not use `output: 'standalone'` here — it breaks `@cloudflare/next-on-pages`
  // (Cloudflare Pages / dashboardbrawlstats.pages.dev).
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.brawlify.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = config.externals ?? []
      config.externals = Array.isArray(externals)
        ? [...externals, { canvas: 'canvas' }]
        : [externals, { canvas: 'canvas' }]
    }

    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
    }

    return config
  },
}

module.exports = nextConfig
