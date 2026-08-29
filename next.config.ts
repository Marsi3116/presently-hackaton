import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse y officeparser son CJS con workers y assets en disco: si el
  // bundler los empaqueta, pdfjs no encuentra su worker en runtime.
  serverExternalPackages: ["pdf-parse", "officeparser"],
};

export default nextConfig;
