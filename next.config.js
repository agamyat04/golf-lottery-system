/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['stripe']
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com']
  }
}

module.exports = nextConfig
