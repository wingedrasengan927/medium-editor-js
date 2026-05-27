import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.js",
      name: "MediumEditorJS",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        /^@lexical/,
        /^lexical/,
        "shiki",
        /^@tabler\/icons/
      ]
    }
  }
});
