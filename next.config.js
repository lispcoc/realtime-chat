/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      '*.mp3': {
        loaders: ['raw-loader'],
        as: '*.js'
      }
    }
  }
}

module.exports = nextConfig
