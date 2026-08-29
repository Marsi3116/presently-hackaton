import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse y officeparser son CJS con workers y assets en disco: si el
  // bundler los empaqueta, pdfjs no encuentra su worker en runtime.
  serverExternalPackages: ["pdf-parse", "officeparser"],

  // pdfjs carga pdf.worker.mjs con un import dinamico armado en runtime, asi
  // que el file tracing de Vercel no lo ve y no lo sube. El sintoma es
  // "Setting up fake worker failed: Cannot find module .../pdf.worker.mjs",
  // solo en produccion: en local el archivo esta en node_modules igual.
  outputFileTracingIncludes: {
    "/api/analyze": [
      "./node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/officeparser/node_modules/pdfjs-dist/legacy/build/**",
    ],
  },
};

export default nextConfig;
