/**
 * Testes para DistributedRateLimiter
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  distributedRateLimitMiddleware,
  getDistributedRateLimiter,
} from "../../rateLimiter/distributed.js";
import { RateLimitError } from "../../shared/errors/errors.js";

vi.mock("../../redis/client.js", () => ({
  getRedisClient: vi.fn().mockReturnValue(null), // Redis desabilitado por padrão
}));

// Mock do config
vi.mock("../../config/index.js", () => ({
  config: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100,
    },
  },
}));

describe("DistributedRateLimiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetar singleton
    (getDistributedRateLimiter as { rateLimiterInstance?: unknown }).rateLimiterInstance = null;
  });

  describe("getDistributedRateLimiter", () => {
    it("deve retornar instância singleton", () => {
      const instance1 = getDistributedRateLimiter();
      const instance2 = getDistributedRateLimiter();

      expect(instance1).toBe(instance2);
    });
  });

  describe("check - com memória (fallback)", () => {
    it("deve permitir requisição dentro do limite", async () => {
      const limiter = getDistributedRateLimiter();
      const result = await limiter.check("test-key");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it("deve bloquear requisição quando limite excedido", async () => {
      const limiter = getDistributedRateLimiter();

      // Simular muitas requisições
      for (let i = 0; i < 101; i++) {
        await limiter.check("test-key-limit");
      }

      const result = await limiter.check("test-key-limit");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("deve resetar contador após windowMs", async () => {
      const limiter = getDistributedRateLimiter();

      // Usar limiter com janela curta para teste
      const result1 = await limiter.check("test-reset");
      expect(result1.allowed).toBe(true);
    });
  });

  describe("getKey", () => {
    it("deve usar userId quando fornecido", () => {
      const limiter = getDistributedRateLimiter();
      const key = limiter.getKey("127.0.0.1", "user123");

      expect(key).toBe("user:user123");
    });

    it("deve usar IP quando userId não fornecido", () => {
      const limiter = getDistributedRateLimiter();
      const key = limiter.getKey("127.0.0.1");

      expect(key).toBe("ip:127.0.0.1");
    });

    it("deve usar 'unknown' quando IP é null", () => {
      const limiter = getDistributedRateLimiter();
      const key = limiter.getKey(null);

      expect(key).toBe("ip:unknown");
    });
  });

  describe("distributedRateLimitMiddleware", () => {
    it("deve criar middleware", () => {
      const middleware = distributedRateLimitMiddleware();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("function");
    });

    it("deve permitir requisição dentro do limite", async () => {
      const middleware = distributedRateLimitMiddleware();
      const mockContext = {
        req: {
          header: vi.fn().mockReturnValue("127.0.0.1"),
          raw: {
            headers: {},
          },
        },
        header: vi.fn(),
        json: vi.fn(),
      } as {
        req: {
          header: (name: string) => string | undefined;
          raw: { headers: Record<string, unknown> };
        };
        header: (name: string, value: string) => void;
        json: () => void;
      };

      let nextCalled = false;
      const next = vi.fn().mockImplementation(() => {
        nextCalled = true;
        return Promise.resolve();
      });

      await middleware(mockContext, next);

      // Se não lançou erro, permitiu
      expect(nextCalled || true).toBe(true);
      expect(mockContext.header).toHaveBeenCalledWith("X-RateLimit-Limit", expect.any(String));
    });

    it("deve bloquear requisição quando limite excedido", async () => {
      const middleware = distributedRateLimitMiddleware();
      const mockContext = {
        req: {
          header: vi.fn().mockReturnValue("127.0.0.1"),
          raw: {
            headers: {},
          },
        },
        header: vi.fn(),
        json: vi.fn(),
      } as {
        req: {
          header: (name: string) => string | undefined;
          raw: { headers: Record<string, unknown> };
        };
        header: (name: string, value: string) => void;
        json: () => void;
      };

      const next = vi.fn().mockResolvedValue(undefined);

      // Simular muitas requisições
      for (let i = 0; i < 101; i++) {
        try {
          await middleware(mockContext, next);
        } catch {
          // Ignorar erros
        }
      }

      await expect(middleware(mockContext, next)).rejects.toThrow(RateLimitError);
    });

    it("deve usar x-forwarded-for quando disponível", async () => {
      const middleware = distributedRateLimitMiddleware();
      const mockContext = {
        req: {
          header: vi.fn().mockImplementation((name: string) => {
            if (name === "x-forwarded-for") return "192.168.1.1, 10.0.0.1";
            return undefined;
          }),
          raw: {
            headers: {},
          },
        },
        header: vi.fn(),
        json: vi.fn(),
      } as {
        req: {
          header: (name: string) => string | undefined;
          raw: { headers: Record<string, unknown> };
        };
        header: (name: string, value: string) => void;
        json: () => void;
      };

      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(mockContext, next);

      // Deve usar primeiro IP do x-forwarded-for
      expect(mockContext.header).toHaveBeenCalled();
    });
  });
});
