/**
 * Testes E2E para API HTTP
 * Testa endpoints completos com servidor Hono
 *
 * NOTA: Estes testes são mais complexos e podem falhar se dependências
 * externas (Ollama, Redis) não estiverem disponíveis.
 * Para testes mais isolados, veja os testes unitários em outras camadas.
 */

import { describe, expect, it } from "vitest";
import app from "../../presentation/app.js";

describe("API Endpoints", () => {
  describe("GET /api/health", () => {
    it("deve retornar status 200", async () => {
      const res = await app.request("/api/health");
      expect(res.status).toBe(200);
    });

    it("deve retornar estrutura de health check", async () => {
      const res = await app.request("/api/health");
      const data = await res.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("dependencies");
    });
  });

  // Testes de endpoints que dependem de serviços externos são mais complexos
  // e devem ser feitos como testes de integração com ambiente configurado
  // Por enquanto, testamos apenas validações básicas

  describe("POST /api/query - validação", () => {
    it("deve rejeitar query vazia", async () => {
      const res = await app.request("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "",
        }),
      });

      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("code");
    });

    it("deve rejeitar requisição sem query", async () => {
      const res = await app.request("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/documents/upload", () => {
    it("deve rejeitar requisição sem arquivo", async () => {
      const res = await app.request("/api/documents/upload", {
        method: "POST",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/collection/info", () => {
    it("deve retornar informações da coleção", async () => {
      const res = await app.request("/api/collection/info");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("stats");
    });
  });

  describe("POST /api/circuit-breaker/reset", () => {
    it("deve resetar circuit breaker", async () => {
      const res = await app.request("/api/circuit-breaker/reset", {
        method: "POST",
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("success");
    });
  });

  describe("Tratamento de erros", () => {
    it("deve retornar erro estruturado para query vazia", async () => {
      const res = await app.request("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "", // Query vazia deve gerar ValidationError
        }),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as { error?: string; code?: string };
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("code");
      expect(data.code).toBe("VALIDATION_ERROR");
    });
  });
});
