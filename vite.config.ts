import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: { outDir: "dist" },
  plugins: [tailwindcss()],
  // In dev, stand in for netlify/functions/get-bikes.js by proxying straight to the Bluebikes API.
  server: {
    proxy: {
      "/.netlify/functions/get-bikes": {
        target: "https://account.bluebikes.com",
        changeOrigin: true,
        rewrite: () => "/bikesharefe-gql",
        configure: (proxy) => {
          // Match the server-side function: send no browser Origin/Referer.
          proxy.on("proxyReq", (req) => {
            req.removeHeader("origin");
            req.removeHeader("referer");
          });
        },
      },
    },
  },
});
