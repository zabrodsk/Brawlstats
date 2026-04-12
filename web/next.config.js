/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
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
