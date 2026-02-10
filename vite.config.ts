import path from "path"
import { defineConfig, type PluginOption } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins: PluginOption[] = [react()]

  if (process.env.ANALYZE) {
    const { visualizer } = await import("rollup-plugin-visualizer")
    plugins.push(
      visualizer({
        open: true,
        filename: "dist/bundle-stats.html",
      }) as PluginOption,
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
