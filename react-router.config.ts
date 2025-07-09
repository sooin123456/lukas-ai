import type { Config } from "@react-router/dev/config";

import { sentryOnBuildEnd } from "@sentry/react-router";
import { vercelPreset } from "@vercel/react-router/vite";
import { readdir } from "node:fs/promises";
import path from "path";

const urls = (
  await readdir(path.join(process.cwd(), "app", "features", "blog", "docs"))
)
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => `/blog/${file.replace(".mdx", "")}`);

export default {
  ssr: true,
  future: {
    unstable_middleware: true,
  },
  presets: [
    vercelPreset(),
  ],
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    if (
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT &&
      process.env.SENTRY_AUTH_TOKEN
    ) {
      await sentryOnBuildEnd({
        viteConfig,
        reactRouterConfig,
        buildManifest,
      });
    }
  },
} satisfies Config;
