import type { NextConfig } from "next"

const isGithubPages = process.env.GITHUB_PAGES === "true"

// The GitHub Pages site is served from a subdirectory, so every URL we emit has
// to carry that prefix. Next rewrites it for <Link> and next/image on its own;
// raw asset URLs go through `assetPath` in lib/asset-path.ts, which reads it
// from here via the inlined env var below.
const basePath = isGithubPages ? "/pos" : ""

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isGithubPages && {
    output: "export",
    basePath,
    images: { unoptimized: true },
  }),
}

export default nextConfig
