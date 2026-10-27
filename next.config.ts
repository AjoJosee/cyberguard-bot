import type { NextConfig } from "next";

const isGithubPages = process.env.DEPLOY_TARGET === 'gh-pages';

const nextConfig: NextConfig = {
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages ? '/cyberguard-bot' : '',
  assetPrefix: isGithubPages ? '/cyberguard-bot/' : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: isGithubPages,
};

export default nextConfig;
