import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/points.js", // aneyo.github.io/points.js
  build: { outDir: "./docs" },
});
