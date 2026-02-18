import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { writeFileSync } from "fs";
import type { Plugin } from "vite";

type PatternJson = {
  expression: string;
  color: string;
  grid: number[][];
  size: { width: number; height: number };
  metadata: Record<string, unknown>;
};

function formatPatternJson(data: PatternJson): string {
  const { grid, ...rest } = data;
  const gridLines = grid.map((row) => `    [${row.join(", ")}]`).join(",\n");
  const restJson = JSON.stringify(rest, null, 2);
  // gridキーをrestJsonに差し込む
  return restJson.replace(/"color":/, `"grid": [\n${gridLines}\n  ],\n  "color":`);
}

function savePatternPlugin(): Plugin {
  return {
    name: "save-pattern",
    configureServer(server) {
      server.middlewares.use("/api/save-pattern", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }
        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(body) as { expression: string; json: PatternJson };
            const filePath = resolve(__dirname, `public/patterns/${data.expression}.json`);
            writeFileSync(filePath, formatPatternJson(data.json));
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), savePatternPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/hume": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
