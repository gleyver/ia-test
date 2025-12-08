/**
 * Testes para DocumentService
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileSize } from "../../domain/valueObjects/fileSize.js";
import { DocumentService } from "../../services/documentService.js";
import { ProcessingError } from "../../shared/errors/errors.js";
import { createTestFile } from "../helpers/factories.js";
import { createMockDocumentProcessor, createMockEmbeddingGenerator, createMockTextChunker, createMockVectorDBFactory, } from "../helpers/mocks.js";
// Mock do fs/promises
vi.mock("fs/promises", async () => {
    const actual = await vi.importActual("fs/promises");
    return {
        ...actual,
        readFile: vi.fn(),
        writeFile: vi.fn(),
        stat: vi.fn(),
        unlink: vi.fn(),
    };
});
// Mock do file-type
vi.mock("file-type", () => ({
    fileTypeFromBuffer: vi.fn().mockResolvedValue({
        mime: "application/pdf",
    }),
}));
describe("DocumentService", () => {
    let service;
    let mockDocumentProcessor;
    let mockChunker;
    let mockEmbeddingGenerator;
    let mockVectorDBFactory;
    beforeEach(() => {
        mockDocumentProcessor = createMockDocumentProcessor();
        mockChunker = createMockTextChunker();
        mockEmbeddingGenerator = createMockEmbeddingGenerator();
        mockVectorDBFactory = createMockVectorDBFactory();
        service = new DocumentService(mockDocumentProcessor, mockChunker, mockEmbeddingGenerator, mockVectorDBFactory);
    });
    describe("processAndIndex", () => {
        it("deve processar e indexar arquivo com sucesso", async () => {
            const file = createTestFile("test.pdf", "Conteúdo de teste");
            vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
                text: "Conteúdo de teste",
                metadata: { extension: ".pdf" },
            });
            const result = await service.processAndIndex(file);
            expect(result).toHaveProperty("sessionId");
            expect(result).toHaveProperty("filename");
            expect(result).toHaveProperty("chunksCreated");
            expect(result).toHaveProperty("metadata");
            expect(result.filename).toBe("test.pdf");
        });
        it("deve usar sessionId fornecido", async () => {
            const file = createTestFile("test.pdf", "Conteúdo");
            const sessionId = "550e8400-e29b-41d4-a716-446655440000";
            vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
                text: "Conteúdo",
                metadata: {},
            });
            const result = await service.processAndIndex(file, sessionId);
            expect(result.sessionId).toBe(sessionId);
        });
        it("deve gerar sessionId quando não fornecido", async () => {
            const file = createTestFile("test.pdf", "Conteúdo");
            vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
                text: "Conteúdo",
                metadata: {},
            });
            const result = await service.processAndIndex(file);
            expect(result.sessionId).toBeDefined();
            expect(result.sessionId.length).toBeGreaterThan(0);
        });
        it("deve rejeitar arquivo muito grande", async () => {
            const largeFile = createTestFile("large.pdf", "x".repeat(FileSize.MAX_BYTES + 1));
            await expect(service.processAndIndex(largeFile)).rejects.toThrow(ProcessingError);
        });
        it("deve sanitizar nome do arquivo", async () => {
            const file = createTestFile("../../etc/passwd.pdf", "Conteúdo");
            vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
                text: "Conteúdo",
                metadata: {},
            });
            const result = await service.processAndIndex(file);
            expect(result.filename).not.toContain("../");
            expect(result.filename).not.toContain("etc");
        });
        it("deve processar arquivo com tempPath existente", async () => {
            const { readFile, stat } = await import("fs/promises");
            vi.mocked(readFile).mockResolvedValue(Buffer.from("test"));
            vi.mocked(stat).mockResolvedValue({ size: 4 });
            const file = {
                name: "test.pdf",
                size: 4,
                type: "application/pdf",
                tempPath: "/tmp/test.pdf",
                arrayBuffer: async () => new ArrayBuffer(4),
            };
            vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
                text: "test",
                metadata: {},
            });
            const result = await service.processAndIndex(file);
            expect(result).toHaveProperty("sessionId");
            expect(mockDocumentProcessor.process).toHaveBeenCalledWith("/tmp/test.pdf");
        });
        it("deve criar arquivo temporário quando não tem tempPath", async () => {
            const { writeFile } = await import("fs/promises");
            vi.mocked(writeFile).mockResolvedValue(undefined);
            const file = createTestFile("test.pdf", "Conteúdo");
            vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
                text: "Conteúdo",
                metadata: {},
            });
            const result = await service.processAndIndex(file);
            expect(result).toHaveProperty("sessionId");
            expect(writeFile).toHaveBeenCalled();
        });
        it("deve limpar arquivo temporário em caso de erro", async () => {
            const { writeFile, unlink } = await import("fs/promises");
            vi.mocked(writeFile).mockResolvedValue(undefined);
            vi.mocked(unlink).mockResolvedValue(undefined);
            const file = createTestFile("test.pdf", "Conteúdo");
            vi.spyOn(mockDocumentProcessor, "process").mockRejectedValue(new Error("Erro no processamento"));
            await expect(service.processAndIndex(file)).rejects.toThrow();
            expect(unlink).toHaveBeenCalled();
        });
        it("deve lançar ProcessingError com detalhes em caso de erro", async () => {
            const file = createTestFile("test.pdf", "Conteúdo");
            const error = new Error("Erro no processamento");
            vi.spyOn(mockDocumentProcessor, "process").mockRejectedValue(error);
            await expect(service.processAndIndex(file)).rejects.toThrow(ProcessingError);
        });
    });
});
//# sourceMappingURL=documentService.test.js.map