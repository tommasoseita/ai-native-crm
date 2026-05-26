import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native binding (.node) — must stay external, not bundled.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
