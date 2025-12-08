/**
 * Testes para Container (DI)
 */
import { describe, expect, it } from "vitest";
import { container, TYPES } from "../../infrastructure/container.js";
describe("Container", () => {
    describe("bindings", () => {
        it("deve resolver DocumentProcessor", () => {
            const processor = container.get(TYPES.DocumentProcessor);
            expect(processor).toBeDefined();
            expect(processor).toHaveProperty("process");
            expect(processor).toHaveProperty("canProcess");
        });
        it("deve resolver QueryService", () => {
            const service = container.get(TYPES.QueryService);
            expect(service).toBeDefined();
            expect(service).toHaveProperty("executeQuery");
        });
        it("deve resolver DocumentService", () => {
            const service = container.get(TYPES.DocumentService);
            expect(service).toBeDefined();
            expect(service).toHaveProperty("processAndIndex");
        });
        it("deve resolver VectorDBFactory", () => {
            const factory = container.get(TYPES.VectorDBFactory);
            expect(factory).toBeDefined();
            expect(typeof factory).toBe("function");
            const vectorDb = factory("test-session");
            expect(vectorDb).toBeDefined();
        });
        it("deve resolver RetrieverFactory", () => {
            const factory = container.get(TYPES.RetrieverFactory);
            expect(factory).toBeDefined();
            expect(typeof factory).toBe("function");
            const vectorDb = container.get(TYPES.VectorDBFactory)("test");
            const retriever = factory(vectorDb);
            expect(retriever).toBeDefined();
        });
        it("deve resolver EmbeddingGenerator", () => {
            const generator = container.get(TYPES.EmbeddingGenerator);
            expect(generator).toBeDefined();
            expect(generator).toHaveProperty("generateEmbedding");
        });
        it("deve resolver ResponseGenerator", () => {
            const generator = container.get(TYPES.ResponseGenerator);
            expect(generator).toBeDefined();
            expect(generator).toHaveProperty("generate");
            expect(generator).toHaveProperty("generateWithoutContext");
        });
        it("deve resolver TextChunker", () => {
            const chunker = container.get(TYPES.TextChunker);
            expect(chunker).toBeDefined();
            expect(chunker).toHaveProperty("createChunks");
        });
        it("deve resolver SessionCleaner", () => {
            const cleaner = container.get(TYPES.SessionCleaner);
            expect(cleaner).toBeDefined();
            expect(cleaner).toHaveProperty("start");
            expect(cleaner).toHaveProperty("stop");
        });
        it("deve resolver EmbeddingCache", () => {
            const cache = container.get(TYPES.EmbeddingCache);
            expect(cache).toBeDefined();
        });
    });
    describe("singletons", () => {
        it("deve retornar mesma instância de DocumentProcessor", () => {
            const instance1 = container.get(TYPES.DocumentProcessor);
            const instance2 = container.get(TYPES.DocumentProcessor);
            expect(instance1).toBe(instance2);
        });
        it("deve retornar mesma instância de QueryService", () => {
            const instance1 = container.get(TYPES.QueryService);
            const instance2 = container.get(TYPES.QueryService);
            expect(instance1).toBe(instance2);
        });
    });
    describe("factories", () => {
        it("deve criar VectorDB diferente para cada sessão", () => {
            const factory = container.get(TYPES.VectorDBFactory);
            const vectorDb1 = factory("session-1");
            const vectorDb2 = factory("session-2");
            expect(vectorDb1).not.toBe(vectorDb2);
        });
        it("deve criar Retriever diferente para cada VectorDB", () => {
            const vectorDbFactory = container.get(TYPES.VectorDBFactory);
            const retrieverFactory = container.get(TYPES.RetrieverFactory);
            const vectorDb1 = vectorDbFactory("session-1");
            const vectorDb2 = vectorDbFactory("session-2");
            const retriever1 = retrieverFactory(vectorDb1);
            const retriever2 = retrieverFactory(vectorDb2);
            expect(retriever1).not.toBe(retriever2);
        });
    });
});
//# sourceMappingURL=container.test.js.map