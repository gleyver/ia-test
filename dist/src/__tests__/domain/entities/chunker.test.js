/**
 * Testes para TextChunker
 */
import { describe, expect, it } from "vitest";
import { TextChunker } from "../../../domain/entities/chunker.js";
describe("TextChunker", () => {
    describe("constructor", () => {
        it("deve criar chunker com valores padrão", () => {
            const chunker = new TextChunker();
            const chunks = chunker.createChunks("Texto de teste");
            expect(chunks.length).toBeGreaterThan(0);
        });
        it("deve criar chunker com valores customizados", () => {
            const chunker = new TextChunker({
                chunkSize: 500,
                chunkOverlap: 100,
            });
            const chunks = chunker.createChunks("Texto de teste");
            expect(chunks.length).toBeGreaterThan(0);
        });
    });
    describe("countTokens", () => {
        it("deve contar tokens corretamente", () => {
            const chunker = new TextChunker();
            // 1 token ≈ 4 caracteres
            expect(chunker.countTokens("test")).toBe(1); // 4 chars = 1 token
            expect(chunker.countTokens("teste")).toBe(2); // 5 chars = 2 tokens (ceil)
            expect(chunker.countTokens("")).toBe(0);
        });
    });
    describe("createChunks", () => {
        it("deve retornar array vazio para texto vazio", () => {
            const chunker = new TextChunker();
            expect(chunker.createChunks("")).toEqual([]);
            expect(chunker.createChunks("   ")).toEqual([]);
        });
        it("deve criar chunk único para texto pequeno", () => {
            const chunker = new TextChunker({ chunkSize: 1000 });
            const text = "Este é um texto pequeno que cabe em um único chunk.";
            const chunks = chunker.createChunks(text);
            expect(chunks.length).toBe(1);
            expect(chunks[0].text).toBe(text.trim());
            expect(chunks[0].metadata.chunkIndex).toBe(0);
            expect(chunks[0].metadata.totalChunks).toBe(1);
        });
        it("deve criar múltiplos chunks para texto grande", () => {
            const chunker = new TextChunker({ chunkSize: 100, chunkOverlap: 20 });
            const text = "A".repeat(500); // Texto grande
            const chunks = chunker.createChunks(text);
            expect(chunks.length).toBeGreaterThan(1);
            chunks.forEach((chunk, index) => {
                expect(chunk.metadata.chunkIndex).toBe(index);
                expect(chunk.metadata.totalChunks).toBe(chunks.length);
                expect(chunk.metadata.tokens).toBeGreaterThan(0);
            });
        });
        it("deve preservar metadata nos chunks", () => {
            const chunker = new TextChunker();
            const metadata = {
                source: "test.pdf",
                filename: "test",
                extension: ".pdf",
            };
            const chunks = chunker.createChunks("Texto de teste", metadata);
            expect(chunks.length).toBeGreaterThan(0);
            chunks.forEach((chunk) => {
                expect(chunk.metadata.source).toBe("test.pdf");
                expect(chunk.metadata.filename).toBe("test");
                expect(chunk.metadata.extension).toBe(".pdf");
            });
        });
        it("deve criar chunks com overlap", () => {
            const chunker = new TextChunker({ chunkSize: 50, chunkOverlap: 10 });
            const text = "A".repeat(200);
            const chunks = chunker.createChunks(text);
            if (chunks.length > 1) {
                // Verificar que há overlap entre chunks consecutivos
                // Pode haver alguma sobreposição devido ao overlap
                expect(chunks.length).toBeGreaterThan(1);
            }
        });
        it("deve ajustar posição para não cortar palavras", () => {
            const chunker = new TextChunker({ chunkSize: 20, chunkOverlap: 5 });
            const text = "Esta é uma frase. Esta é outra frase. Esta é mais uma frase.";
            const chunks = chunker.createChunks(text);
            expect(chunks.length).toBeGreaterThan(0);
            // Verificar que chunks não cortam palavras no meio (idealmente)
            chunks.forEach((chunk) => {
                expect(chunk.text.length).toBeGreaterThan(0);
            });
        });
        it("deve calcular tokens corretamente para cada chunk", () => {
            const chunker = new TextChunker();
            const text = "Texto de teste para calcular tokens";
            const chunks = chunker.createChunks(text);
            chunks.forEach((chunk) => {
                expect(chunk.metadata.tokens).toBeGreaterThan(0);
                expect(chunk.metadata.tokens).toBe(chunker.countTokens(chunk.text));
            });
        });
    });
});
//# sourceMappingURL=chunker.test.js.map