/**
 * Testes para ExecuteQueryUseCase
 * Testa lógica de negócio de execução de queries
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExecuteQueryUseCase } from "../../../domain/useCases/executeQueryUseCase.js";
import { Query } from "../../../domain/valueObjects/query.js";
import { createMockSearchResult, createMockVectorDB } from "../../helpers/mocks.js";
describe("ExecuteQueryUseCase", () => {
    let useCase;
    let mockRetrieverFactory;
    let mockResponseGenerator;
    let mockVectorDB;
    beforeEach(() => {
        mockVectorDB = createMockVectorDB();
        vi.spyOn(mockVectorDB, "initialize").mockResolvedValue(undefined);
        const mockRetriever = {
            retrieve: vi
                .fn()
                .mockResolvedValue([
                createMockSearchResult("Documento relevante 1", 0.95),
                createMockSearchResult("Documento relevante 2", 0.9),
            ]),
        };
        mockRetrieverFactory = vi.fn().mockReturnValue(mockRetriever);
        mockResponseGenerator = {
            generate: vi.fn().mockResolvedValue({
                response: "Resposta gerada com contexto",
                sources: [],
                metadata: {
                    model: "llama3.2",
                    numSources: 2,
                },
            }),
            generateWithoutContext: vi.fn().mockResolvedValue({
                response: "Resposta sem contexto",
                sources: [],
                metadata: {
                    model: "llama3.2",
                    numSources: 0,
                },
            }),
        };
        useCase = new ExecuteQueryUseCase(mockRetrieverFactory, mockResponseGenerator);
    });
    describe("execute - com arquivo e VectorDB", () => {
        it("deve buscar documentos relevantes e gerar resposta com contexto", async () => {
            const query = Query.fromString("Qual é o conteúdo?");
            const result = await useCase.execute({
                query,
                vectorDb: mockVectorDB,
                hasFile: true,
            });
            expect(mockVectorDB.initialize).toHaveBeenCalled();
            expect(mockRetrieverFactory).toHaveBeenCalledWith(mockVectorDB);
            expect(mockResponseGenerator.generate).toHaveBeenCalledWith("Qual é o conteúdo?", expect.arrayContaining([
                expect.objectContaining({
                    text: "Documento relevante 1",
                    similarity: 0.95,
                }),
            ]));
            expect(result.response).toBe("Resposta gerada com contexto");
            expect(result.sources).toHaveLength(2);
            expect(result.metadata.hasContext).toBe(true);
            expect(result.metadata.sourcesCount).toBe(2);
        });
        it("deve usar conhecimento do modelo quando não encontrar documentos", async () => {
            const mockRetriever = {
                retrieve: vi.fn().mockResolvedValue([]),
            };
            mockRetrieverFactory = vi.fn().mockReturnValue(mockRetriever);
            useCase = new ExecuteQueryUseCase(mockRetrieverFactory, mockResponseGenerator);
            const query = Query.fromString("Qual é o conteúdo?");
            const result = await useCase.execute({
                query,
                vectorDb: mockVectorDB,
                hasFile: true,
            });
            expect(mockResponseGenerator.generateWithoutContext).toHaveBeenCalledWith("Qual é o conteúdo?");
            expect(result.metadata.hasContext).toBe(false);
            expect(result.sources).toHaveLength(0);
        });
    });
    describe("execute - sem arquivo", () => {
        it("deve usar conhecimento do modelo quando não há arquivo", async () => {
            const query = Query.fromString("O que é inteligência artificial?");
            const result = await useCase.execute({
                query,
                vectorDb: null,
                hasFile: false,
            });
            expect(mockVectorDB.initialize).not.toHaveBeenCalled();
            expect(mockRetrieverFactory).not.toHaveBeenCalled();
            expect(mockResponseGenerator.generateWithoutContext).toHaveBeenCalledWith("O que é inteligência artificial?");
            expect(result.response).toBe("Resposta sem contexto");
            expect(result.metadata.hasContext).toBe(false);
            expect(result.sources).toHaveLength(0);
        });
    });
    describe("execute - mapeamento de sources", () => {
        it("deve mapear corretamente os sources retornados", async () => {
            const query = Query.fromString("Teste");
            const result = await useCase.execute({
                query,
                vectorDb: mockVectorDB,
                hasFile: true,
            });
            expect(result.sources).toEqual([
                {
                    text: "Documento relevante 1",
                    similarity: 0.95,
                    metadata: expect.any(Object),
                },
                {
                    text: "Documento relevante 2",
                    similarity: 0.9,
                    metadata: expect.any(Object),
                },
            ]);
        });
    });
});
//# sourceMappingURL=executeQueryUseCase.test.js.map