import { defineConfig } from "vitest/config";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";

// Vitest не завантажує .env автоматично (на відміну від Next.js) — робимо
// це вручну для інтеграційних тестів, яким потрібен DATABASE_URL.
const envPath = path.resolve(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    const key = match?.[1];
    const value = match?.[2];
    if (key && value !== undefined && !process.env[key]) {
      process.env[key] = value.replace(/^"(.*)"$/, "$1");
    }
  }
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
