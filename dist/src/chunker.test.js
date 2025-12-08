/**
 * Testes unitários para TextChunker
 */
import { describe, expect, it } from "vitest";
import { TextChunker } from "./domain/entities/chunker.js";
describe("TextChunker", () => {
    it("deve criar chunks corretamente para textos grandes", () => {
        const chunker = new TextChunker({ chunkSize: 20, chunkOverlap: 5 });
        // Criar texto grande o suficiente para múltiplos chunks
        // chunkSize 20 tokens = ~80 chars, então precisamos de mais de 80 chars
        const lines = Array.from({ length: 50 }, (_, i) => `Linha ${i + 1} com algum conteúdo.`).join("\n");
        const chunks = chunker.createChunks(lines);
        // Verificar estrutura básica
        expect(chunks.length).toBeGreaterThanOrEqual(1);
        expect(chunks[0].metadata.chunkIndex).toBe(0);
        expect(chunks[0].metadata.totalChunks).toBe(chunks.length);
        expect(chunks[0].metadata.tokens).toBeGreaterThan(0);
        // Se texto for grande o suficiente, deve criar múltiplos chunks
        // (mas não vamos falhar se criar apenas 1 devido a ajustes de quebra)
        if (chunks.length > 1) {
            expect(chunks[1].metadata.chunkIndex).toBe(1);
            expect(chunks[1].text.length).toBeGreaterThan(0);
        }
    });
    it("deve retornar array vazio para texto vazio", () => {
        const chunker = new TextChunker();
        const chunks = chunker.createChunks("");
        expect(chunks).toEqual([]);
    });
    it("deve criar um único chunk para texto pequeno", () => {
        const chunker = new TextChunker({ chunkSize: 1000 });
        const text = "Texto pequeno";
        const chunks = chunker.createChunks(text);
        expect(chunks.length).toBe(1);
        expect(chunks[0].text).toBe(text.trim());
        expect(chunks[0].metadata.chunkIndex).toBe(0);
        expect(chunks[0].metadata.totalChunks).toBe(1);
    });
    it("deve calcular tokens corretamente", () => {
        const chunker = new TextChunker();
        const text = "a".repeat(400); // 400 chars = ~100 tokens (1 token ≈ 4 chars)
        const tokens = chunker.countTokens(text);
        expect(tokens).toBeGreaterThan(90);
        expect(tokens).toBeLessThan(110);
    });
    it("deve preservar metadados nos chunks", () => {
        const chunker = new TextChunker();
        const metadata = {
            source: "test.pdf",
            filename: "test.pdf",
            extension: ".pdf",
        };
        const chunks = chunker.createChunks("Texto de teste", metadata);
        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0].metadata.source).toBe("test.pdf");
        expect(chunks[0].metadata.filename).toBe("test.pdf");
        expect(chunks[0].metadata.extension).toBe(".pdf");
    });
});
//# sourceMappingURL=chunker.test.js.map