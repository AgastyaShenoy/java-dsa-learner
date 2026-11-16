import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // A self-contained server (server.js + only the files it needs), which the desktop
  // app ships and runs locally. `next dev` is unaffected.
  output: "standalone",
};

export default nextConfig;
