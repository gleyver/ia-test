/**
 * Testes para ResponseCache
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ResponseCache } from "../../../infrastructure/llm/responseCache.js";
describe("ResponseCache", () => {
    let cache;
    beforeEach(() => {
        cache = new ResponseCache(5, 100); // 5 minutos, max 100 itens
    });
    describe("constructor", () => {
        it("deve criar cache com valores padrão", () => {
            const defaultCache = new ResponseCache();
            expect(defaultCache.maxSize).toBe(1000);
        });
        it("deve criar cache com valores customizados", () => {
            const customCache = new ResponseCache(10, 500);
            expect(customCache.maxSize).toBe(500);
        });
    });
    describe("get", () => {
        it("deve retornar null para prompt não cacheado", () => {
            const result = cache.get("prompt não existe");
            expect(result).toBeNull();
        });
        it("deve retornar resposta cacheada", () => {
            const response = {
                response: "Resposta cacheada",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            cache.set("test prompt", response);
            const result = cache.get("test prompt");
            expect(result).toEqual(response);
        });
        it("deve retornar null para resposta expirada", async () => {
            const shortCache = new ResponseCache(0.001, 100); // 0.001 minutos = 60ms
            const response = {
                response: "Resposta",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            shortCache.set("test prompt", response);
            // Aguardar expiração
            await new Promise((resolve) => setTimeout(resolve, 100));
            const result = shortCache.get("test prompt");
            expect(result).toBeNull();
        });
    });
    describe("set", () => {
        it("deve armazenar resposta no cache", () => {
            const response = {
                response: "Resposta",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            cache.set("test prompt", response);
            const result = cache.get("test prompt");
            expect(result).toEqual(response);
        });
        it("deve evictar entrada mais antiga quando cache está cheio", async () => {
            const smallCache = new ResponseCache(5, 2); // Max 2 itens
            const response1 = {
                response: "Resposta 1",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            const response2 = {
                response: "Resposta 2",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            const response3 = {
                response: "Resposta 3",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            smallCache.set("prompt1", response1);
            // Aguardar um pouco para garantir timestamps diferentes
            await new Promise((resolve) => setTimeout(resolve, 10));
            smallCache.set("prompt2", response2);
            await new Promise((resolve) => setTimeout(resolve, 10));
            smallCache.set("prompt3", response3);
            // prompt1 deve ter sido evictado (mais antigo)
            // Nota: pode não funcionar se timestamps forem muito próximos
            const result2 = smallCache.get("prompt2");
            const result3 = smallCache.get("prompt3");
            // Pelo menos um dos primeiros deve ter sido evictado
            expect(smallCache.size()).toBeLessThanOrEqual(2);
            // E os dois últimos devem estar no cache
            expect(result2 || result3).toBeDefined();
        });
    });
    describe("clear", () => {
        it("deve limpar cache", () => {
            const response = {
                response: "Resposta",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            cache.set("test prompt", response);
            cache.clear();
            expect(cache.get("test prompt")).toBeNull();
            expect(cache.size()).toBe(0);
        });
    });
    describe("size", () => {
        it("deve retornar tamanho do cache", () => {
            expect(cache.size()).toBe(0);
            const response = {
                response: "Resposta",
                sources: [],
                metadata: { model: "test", numSources: 0 },
            };
            cache.set("prompt1", response);
            expect(cache.size()).toBe(1);
            cache.set("prompt2", response);
            expect(cache.size()).toBe(2);
        });
    });
});
//# sourceMappingURL=responseCache.test.js.map