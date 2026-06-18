import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    dirs: ["app", "components", "lib", "tests"],
  },
};

export default nextConfig;
