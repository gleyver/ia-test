/**
 * Configuração do Vitest para testes unitários
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/", "dist/", "azure/"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "azure/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/__mocks__/**",
      ],
    },
  },
});
