import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "QUARRY_");
  const proxy = { "/api": { target: environment.QUARRY_API_PROXY ?? "http://localhost:5137", changeOrigin: true } };
  return {
    server: { proxy, strictPort: true },
    preview: { proxy, strictPort: true }
  };
});
