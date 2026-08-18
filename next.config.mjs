/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["src", "prisma", "tests"],
  },
};

export default nextConfig;
