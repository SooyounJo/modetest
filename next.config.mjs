/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // 루트 추적 경고 제거: 상위 경로의 다른 lockfile 때문에 워크스페이스 루트 오인식 방지
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
};

export default nextConfig;
