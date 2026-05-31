import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { createApiDevMiddleware } from "./lib/api/dev-middleware";

function apiDevPlugin(): Plugin {
  return {
    name: "api-dev",
    enforce: "pre",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
      // Must run before TanStack Start — it 404s unknown paths without calling next()
      const handler = createApiDevMiddleware();
      server.middlewares.stack.unshift({ route: "", handle: handler });
    },
  };
}

export default defineConfig({
  plugins: [
    apiDevPlugin(),
    tanstackStart({
      prerender: {
        enabled: true,
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
