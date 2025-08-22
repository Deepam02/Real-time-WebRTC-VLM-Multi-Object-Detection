/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SIGNALING_SERVER_URL: process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:3001',
    NEXT_PUBLIC_DETECTION_SERVER_URL: process.env.NEXT_PUBLIC_DETECTION_SERVER_URL || 'http://localhost:5000',
  },
}

module.exports = nextConfig
