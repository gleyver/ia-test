/**
 * Testes para RetryStrategy
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RetryStrategy } from "../../../infrastructure/llm/retryStrategy.js";
describe("RetryStrategy", () => {
    let strategy;
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    describe("constructor", () => {
        it("deve criar RetryStrategy com valores padrão", () => {
            strategy = new RetryStrategy();
            expect(strategy.maxRetries).toBe(3);
        });
        it("deve criar RetryStrategy com valores customizados", () => {
            strategy = new RetryStrategy(5, 2000);
            expect(strategy.maxRetries).toBe(5);
        });
    });
    describe("getDelay", () => {
        it("deve calcular delay com exponential backoff", () => {
            strategy = new RetryStrategy(3, 1000);
            expect(strategy.getDelay(0)).toBe(1000); // 1000 * 2^0 = 1000
            expect(strategy.getDelay(1)).toBe(2000); // 1000 * 2^1 = 2000
            expect(strategy.getDelay(2)).toBe(4000); // 1000 * 2^2 = 4000
        });
        it("deve calcular delay com baseDelay customizado", () => {
            strategy = new RetryStrategy(3, 500);
            expect(strategy.getDelay(0)).toBe(500);
            expect(strategy.getDelay(1)).toBe(1000);
            expect(strategy.getDelay(2)).toBe(2000);
        });
    });
    describe("shouldRetry", () => {
        it("deve retornar true quando retryCount < maxRetries", () => {
            strategy = new RetryStrategy(3);
            expect(strategy.shouldRetry(0)).toBe(true);
            expect(strategy.shouldRetry(1)).toBe(true);
            expect(strategy.shouldRetry(2)).toBe(true);
        });
        it("deve retornar false quando retryCount >= maxRetries", () => {
            strategy = new RetryStrategy(3);
            expect(strategy.shouldRetry(3)).toBe(false);
            expect(strategy.shouldRetry(4)).toBe(false);
        });
        it("deve respeitar maxRetries customizado", () => {
            strategy = new RetryStrategy(5);
            expect(strategy.shouldRetry(4)).toBe(true);
            expect(strategy.shouldRetry(5)).toBe(false);
        });
    });
    describe("waitBeforeRetry", () => {
        it("deve aguardar delay calculado", async () => {
            strategy = new RetryStrategy(3, 1000);
            const waitPromise = strategy.waitBeforeRetry(0);
            // Avançar timer
            vi.advanceTimersByTime(1000);
            await waitPromise;
            // Se chegou aqui, funcionou
            expect(true).toBe(true);
        });
        it("deve aguardar delay exponencial", async () => {
            strategy = new RetryStrategy(3, 1000);
            const waitPromise1 = strategy.waitBeforeRetry(1);
            vi.advanceTimersByTime(2000);
            await waitPromise1;
            const waitPromise2 = strategy.waitBeforeRetry(2);
            vi.advanceTimersByTime(4000);
            await waitPromise2;
            // Se chegou aqui, funcionou
            expect(true).toBe(true);
        });
    });
});
//# sourceMappingURL=retryStrategy.test.js.map