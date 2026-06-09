/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media-cdn.cortextech.io" },
      { protocol: "https", hostname: "media-cdn.incrowdsports.com" },
    ],
  },
};

export default nextConfig;
