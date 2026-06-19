import "@repro-v2/env/docs";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  reactCompiler: true,
};

export default withMDX(nextConfig);
