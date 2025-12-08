/**
 * Testes para QueryService
 * Testa orquestração de queries com mocks de dependências
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryService } from "../../services/queryService.js";
import { createTestQuery } from "../helpers/factories.js";
import { createMockResponseGenerator, createMockRetrieverFactory, createMockVectorDB, } from "../helpers/mocks.js";
describe("QueryService", () => {
    let service;
    let mockRetrieverFactory;
    let mockResponseGenerator;
    let mockVectorDB;
    beforeEach(() => {
        mockVectorDB = createMockVectorDB();
        mockRetrieverFactory = createMockRetrieverFactory();
        mockResponseGenerator = createMockResponseGenerator();
        service = new QueryService(mockRetrieverFactory, mockResponseGenerator);
    });
    describe("executeQuery - com arquivo", () => {
        it("deve executar query com arquivo e retornar resposta", async () => {
            const query = createTestQuery("Qual é o conteúdo?");
            const result = await service.executeQuery(query.toString(), mockVectorDB, true);
            expect(result.response).toBeDefined();
            expect(result.sources).toBeDefined();
            expect(result.metadata).toBeDefined();
            expect(result.metadata.model).toBe("llama3.2");
        });
        it("deve mapear sources corretamente", async () => {
            const query = createTestQuery("Teste");
            const result = await service.executeQuery(query.toString(), mockVectorDB, true);
            expect(Array.isArray(result.sources)).toBe(true);
            expect(result.metadata.numSources).toBeGreaterThanOrEqual(0);
        });
    });
    describe("executeQuery - sem arquivo", () => {
        it("deve executar query sem arquivo usando conhecimento do modelo", async () => {
            const query = createTestQuery("O que é IA?");
            const result = await service.executeQuery(query.toString(), null, false);
            expect(result.response).toBeDefined();
            expect(result.metadata.numSources).toBe(0);
        });
    });
    describe("executeQuery - tratamento de erros", () => {
        it("deve lançar ProcessingError em caso de falha", async () => {
            const errorGenerator = {
                ...createMockResponseGenerator(),
                generate: vi.fn().mockRejectedValue(new Error("Erro no LLM")),
            };
            service = new QueryService(mockRetrieverFactory, errorGenerator);
            const query = createTestQuery("Teste");
            await expect(service.executeQuery(query.toString(), mockVectorDB, true)).rejects.toThrow();
        });
    });
    describe("executeQuery - validação de Query", () => {
        it("deve rejeitar query vazia", async () => {
            await expect(service.executeQuery("", mockVectorDB, true)).rejects.toThrow();
        });
        it("deve rejeitar query muito longa", async () => {
            const longQuery = "a".repeat(10001);
            await expect(service.executeQuery(longQuery, mockVectorDB, true)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=queryService.test.js.map