/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack (config, options) {
    config.module.rules.push({
      test: /\.mp3$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]'
      }
    })
    return config
  },
  env: {
    IS_IN_MAINTENANCE_MODE: process.env.IS_IN_MAINTENANCE_MODE,
  }
}

module.exports = nextConfig
