/**
 * Testes para ProcessDocumentUseCase
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IDocumentProcessor } from "../../../domain/interfaces/documentProcessor.interface.js";
import type { IEmbeddingGenerator } from "../../../domain/interfaces/embeddingGenerator.interface.js";
import type { ITextChunker } from "../../../domain/interfaces/textChunker.interface.js";
import { ProcessDocumentUseCase } from "../../../domain/useCases/processDocumentUseCase.js";
import { SessionId } from "../../../domain/valueObjects/sessionId.js";
import type { VectorDB } from "../../../infrastructure/storage/vectorDb.js";
import { createTestFile } from "../../helpers/factories.js";
import {
  createMockDocumentProcessor,
  createMockEmbeddingGenerator,
  createMockTextChunker,
  createMockVectorDB,
} from "../../helpers/mocks.js";

describe("ProcessDocumentUseCase", () => {
  let useCase: ProcessDocumentUseCase;
  let mockDocumentProcessor: IDocumentProcessor;
  let mockChunker: ITextChunker;
  let mockEmbeddingGenerator: IEmbeddingGenerator;
  let mockVectorDBFactory: (sessionId: string) => VectorDB;

  beforeEach(() => {
    mockDocumentProcessor = createMockDocumentProcessor();
    mockChunker = createMockTextChunker();
    mockEmbeddingGenerator = createMockEmbeddingGenerator();

    const mockVectorDB = createMockVectorDB();
    vi.spyOn(mockVectorDB, "initialize").mockResolvedValue(undefined);
    vi.spyOn(mockVectorDB, "addDocuments").mockResolvedValue(undefined);

    mockVectorDBFactory = vi.fn().mockReturnValue(mockVectorDB);

    useCase = new ProcessDocumentUseCase(
      mockDocumentProcessor,
      mockChunker,
      mockEmbeddingGenerator,
      mockVectorDBFactory
    );
  });

  describe("execute", () => {
    it("deve processar documento e criar chunks", async () => {
      const file = createTestFile("test.pdf", "Conteúdo de teste para chunking");
      vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
        text: "Conteúdo de teste para chunking",
        metadata: { extension: ".pdf" },
      });

      const result = await useCase.execute({ file });

      expect(mockDocumentProcessor.process).toHaveBeenCalled();
      expect(result.chunksCreated).toBeGreaterThan(0);
      expect(result.sessionId).toBeInstanceOf(SessionId);
    });

    it("deve gerar SessionId quando não fornecido", async () => {
      const file = createTestFile("test.pdf", "Conteúdo");
      vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
        text: "Conteúdo",
        metadata: {},
      });

      const result = await useCase.execute({ file });

      expect(result.sessionId).toBeInstanceOf(SessionId);
    });

    it("deve usar SessionId fornecido", async () => {
      const file = createTestFile("test.pdf", "Conteúdo");
      const sessionId = SessionId.generate();
      vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
        text: "Conteúdo",
        metadata: {},
      });

      const result = await useCase.execute({ file, sessionId });

      expect(result.sessionId).toBe(sessionId);
    });

    it("deve criar VectorDB para a sessão", async () => {
      const file = createTestFile("test.pdf", "Conteúdo");
      const sessionId = SessionId.generate();
      vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
        text: "Conteúdo",
        metadata: {},
      });

      await useCase.execute({ file, sessionId });

      expect(mockVectorDBFactory).toHaveBeenCalledWith(sessionId.toString());
    });

    it("deve inicializar e adicionar documentos ao VectorDB", async () => {
      const file = createTestFile("test.pdf", "Conteúdo");
      const mockVectorDB = createMockVectorDB();
      const initSpy = vi.spyOn(mockVectorDB, "initialize").mockResolvedValue(undefined);
      const addSpy = vi.spyOn(mockVectorDB, "addDocuments").mockResolvedValue(undefined);
      mockVectorDBFactory = vi.fn().mockReturnValue(mockVectorDB);

      useCase = new ProcessDocumentUseCase(
        mockDocumentProcessor,
        mockChunker,
        mockEmbeddingGenerator,
        mockVectorDBFactory
      );

      vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
        text: "Conteúdo",
        metadata: {},
      });

      await useCase.execute({ file });

      expect(initSpy).toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalled();
    });

    it("deve retornar metadata do documento processado", async () => {
      const file = createTestFile("test.pdf", "Conteúdo");
      const metadata = { extension: ".pdf", pages: 1 };
      vi.spyOn(mockDocumentProcessor, "process").mockResolvedValue({
        text: "Conteúdo",
        metadata,
      });

      const result = await useCase.execute({ file });

      expect(result.metadata).toEqual(metadata);
    });
  });
});
