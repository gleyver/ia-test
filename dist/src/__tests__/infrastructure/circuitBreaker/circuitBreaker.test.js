/**
 * Testes para CircuitBreaker
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker, CircuitState, } from "../../../infrastructure/circuitBreaker/circuitBreaker.js";
describe("CircuitBreaker", () => {
    let circuitBreaker;
    beforeEach(() => {
        circuitBreaker = new CircuitBreaker({
            timeout: 1000,
            errorThresholdPercentage: 50,
            resetTimeout: 100,
        });
    });
    describe("constructor", () => {
        it("deve criar CircuitBreaker com estado CLOSED", () => {
            expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
        });
        it("deve criar CircuitBreaker com configuração customizada", () => {
            const cb = new CircuitBreaker({
                timeout: 2000,
                errorThresholdPercentage: 75,
                resetTimeout: 200,
            });
            expect(cb.getState()).toBe(CircuitState.CLOSED);
        });
    });
    describe("execute - sucesso", () => {
        it("deve executar função com sucesso quando CLOSED", async () => {
            const fn = vi.fn().mockResolvedValue("success");
            const result = await circuitBreaker.execute(fn);
            expect(result).toBe("success");
            expect(fn).toHaveBeenCalled();
            expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
        });
        it("deve incrementar contador de sucessos", async () => {
            const fn = vi.fn().mockResolvedValue("success");
            await circuitBreaker.execute(fn);
            await circuitBreaker.execute(fn);
            const stats = circuitBreaker.getStats();
            expect(stats.successes).toBeGreaterThan(0);
        });
        it("deve resetar falhas após muitos sucessos", async () => {
            // Simular algumas falhas primeiro
            const failingFn = vi.fn().mockRejectedValue(new Error("fail"));
            try {
                await circuitBreaker.execute(failingFn);
            }
            catch {
                // Ignorar erro
            }
            // Depois muitos sucessos
            const successFn = vi.fn().mockResolvedValue("success");
            for (let i = 0; i < 15; i++) {
                await circuitBreaker.execute(successFn);
            }
            const stats = circuitBreaker.getStats();
            expect(stats.failures).toBe(0);
        });
    });
    describe("execute - falha", () => {
        it("deve incrementar contador de falhas", async () => {
            const fn = vi.fn().mockRejectedValue(new Error("fail"));
            try {
                await circuitBreaker.execute(fn);
            }
            catch {
                // Ignorar erro
            }
            const stats = circuitBreaker.getStats();
            expect(stats.failures).toBeGreaterThan(0);
        });
        it("deve abrir circuit após muitas falhas", async () => {
            const failingFn = vi.fn().mockRejectedValue(new Error("fail"));
            // Simular muitas falhas
            for (let i = 0; i < 10; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                }
                catch {
                    // Ignorar erro
                }
            }
            expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
        });
        it("deve usar fallback quando OPEN", async () => {
            // Abrir circuit primeiro
            const failingFn = vi.fn().mockRejectedValue(new Error("fail"));
            for (let i = 0; i < 10; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                }
                catch {
                    // Ignorar
                }
            }
            const fallback = vi.fn().mockResolvedValue("fallback");
            const result = await circuitBreaker.execute(failingFn, fallback);
            expect(result).toBe("fallback");
            expect(fallback).toHaveBeenCalled();
        });
        it("deve lançar erro quando OPEN e sem fallback", async () => {
            // Abrir circuit
            const failingFn = vi.fn().mockRejectedValue(new Error("fail"));
            for (let i = 0; i < 10; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                }
                catch {
                    // Ignorar
                }
            }
            await expect(circuitBreaker.execute(failingFn)).rejects.toThrow("Circuit breaker está OPEN");
        });
    });
    describe("execute - timeout", () => {
        it("deve tratar timeout como falha", async () => {
            const slowFn = vi
                .fn()
                .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 2000)));
            await expect(circuitBreaker.execute(slowFn)).rejects.toThrow("Timeout");
        });
    });
    describe("execute - HALF_OPEN", () => {
        it("deve tentar resetar após resetTimeout", async () => {
            // Abrir circuit
            const failingFn = vi.fn().mockRejectedValue(new Error("fail"));
            for (let i = 0; i < 10; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                }
                catch {
                    // Ignorar
                }
            }
            expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
            // Aguardar resetTimeout
            await new Promise((resolve) => setTimeout(resolve, 150));
            // Tentar executar novamente (deve entrar em HALF_OPEN)
            const successFn = vi.fn().mockResolvedValue("success");
            await circuitBreaker.execute(successFn);
            expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
        });
        it("deve voltar para OPEN se teste falhar", async () => {
            // Abrir circuit
            const failingFn = vi.fn().mockRejectedValue(new Error("fail"));
            for (let i = 0; i < 10; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                }
                catch {
                    // Ignorar
                }
            }
            // Aguardar resetTimeout
            await new Promise((resolve) => setTimeout(resolve, 150));
            // Tentar executar e falhar (deve voltar para OPEN)
            try {
                await circuitBreaker.execute(failingFn);
            }
            catch {
                // Ignorar
            }
            expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
        });
    });
    describe("getState", () => {
        it("deve retornar estado atual", () => {
            expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
        });
    });
    describe("getStats", () => {
        it("deve retornar estatísticas", () => {
            const stats = circuitBreaker.getStats();
            expect(stats).toHaveProperty("failures");
            expect(stats).toHaveProperty("successes");
            expect(stats).toHaveProperty("lastFailureTime");
            expect(stats).toHaveProperty("state");
        });
    });
    describe("reset", () => {
        it("deve resetar circuit breaker", async () => {
            // Simular algumas falhas
            const failingFn = vi.fn().mockRejectedValue(new Error("fail"));
            try {
                await circuitBreaker.execute(failingFn);
            }
            catch {
                // Ignorar
            }
            circuitBreaker.reset();
            const stats = circuitBreaker.getStats();
            expect(stats.failures).toBe(0);
            expect(stats.successes).toBe(0);
            expect(stats.state).toBe(CircuitState.CLOSED);
            expect(stats.lastFailureTime).toBeNull();
        });
    });
});
//# sourceMappingURL=circuitBreaker.test.js.map