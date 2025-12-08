/**
 * Testes para ProcessorRegistry
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProcessorRegistry } from "../../../infrastructure/processors/processorRegistry.js";
import { ProcessingError } from "../../../shared/errors/errors.js";
import { createMockDocumentProcessor } from "../../helpers/mocks.js";

describe("ProcessorRegistry", () => {
  let registry: ProcessorRegistry;

  beforeEach(() => {
    registry = new ProcessorRegistry();
  });

  describe("register", () => {
    it("deve registrar processador", () => {
      const processor = createMockDocumentProcessor();
      vi.spyOn(processor, "supportedExtensions").mockReturnValue([".pdf"]);

      registry.register(processor);

      expect(registry.isSupported(".pdf")).toBe(true);
    });

    it("deve registrar múltiplos processadores", () => {
      const processor1 = createMockDocumentProcessor();
      vi.spyOn(processor1, "supportedExtensions").mockReturnValue([".pdf"]);

      const processor2 = createMockDocumentProcessor();
      vi.spyOn(processor2, "supportedExtensions").mockReturnValue([".txt"]);

      registry.register(processor1);
      registry.register(processor2);

      expect(registry.isSupported(".pdf")).toBe(true);
      expect(registry.isSupported(".txt")).toBe(true);
    });
  });

  describe("getProcessor", () => {
    it("deve retornar processador para extensão suportada", () => {
      const processor = createMockDocumentProcessor();
      vi.spyOn(processor, "canProcess").mockReturnValue(true);
      vi.spyOn(processor, "supportedExtensions").mockReturnValue([".pdf"]);

      registry.register(processor);

      const result = registry.getProcessor(".pdf");
      expect(result).toBe(processor);
    });

    it("deve lançar erro para extensão não suportada", () => {
      expect(() => registry.getProcessor(".xyz")).toThrow(ProcessingError);
    });

    it("deve lançar erro com extensões suportadas na mensagem", () => {
      const processor = createMockDocumentProcessor();
      vi.spyOn(processor, "canProcess").mockImplementation(
        (ext) => ext === ".pdf" || ext === ".txt"
      );
      vi.spyOn(processor, "supportedExtensions").mockReturnValue([".pdf", ".txt"]);

      registry.register(processor);

      expect(() => registry.getProcessor(".xyz")).toThrow(ProcessingError);

      try {
        registry.getProcessor(".xyz");
      } catch (error) {
        expect(error).toBeInstanceOf(ProcessingError);
        if (error instanceof ProcessingError) {
          expect(error.details).toHaveProperty("supportedExtensions");
        }
      }
    });
  });

  describe("getAllSupportedExtensions", () => {
    it("deve retornar array vazio quando não há processadores", () => {
      const extensions = registry.getAllSupportedExtensions();
      expect(extensions).toEqual([]);
    });

    it("deve retornar todas as extensões suportadas", () => {
      const processor1 = createMockDocumentProcessor();
      vi.spyOn(processor1, "supportedExtensions").mockReturnValue([".pdf", ".docx"]);

      const processor2 = createMockDocumentProcessor();
      vi.spyOn(processor2, "supportedExtensions").mockReturnValue([".txt", ".html"]);

      registry.register(processor1);
      registry.register(processor2);

      const extensions = registry.getAllSupportedExtensions();
      expect(extensions).toContain(".pdf");
      expect(extensions).toContain(".docx");
      expect(extensions).toContain(".txt");
      expect(extensions).toContain(".html");
      expect(extensions.length).toBe(4);
    });

    it("não deve duplicar extensões", () => {
      const processor1 = createMockDocumentProcessor();
      vi.spyOn(processor1, "supportedExtensions").mockReturnValue([".pdf"]);

      const processor2 = createMockDocumentProcessor();
      vi.spyOn(processor2, "supportedExtensions").mockReturnValue([".pdf"]);

      registry.register(processor1);
      registry.register(processor2);

      const extensions = registry.getAllSupportedExtensions();
      expect(extensions).toEqual([".pdf"]);
    });
  });

  describe("isSupported", () => {
    it("deve retornar true para extensão suportada", () => {
      const processor = createMockDocumentProcessor();
      vi.spyOn(processor, "canProcess").mockReturnValue(true);
      vi.spyOn(processor, "supportedExtensions").mockReturnValue([".pdf"]);

      registry.register(processor);

      expect(registry.isSupported(".pdf")).toBe(true);
    });

    it("deve retornar false para extensão não suportada", () => {
      expect(registry.isSupported(".xyz")).toBe(false);
    });

    it("deve ser case-insensitive", () => {
      const processor = createMockDocumentProcessor();
      vi.spyOn(processor, "canProcess").mockImplementation((ext) => ext.toLowerCase() === ".pdf");
      vi.spyOn(processor, "supportedExtensions").mockReturnValue([".pdf"]);

      registry.register(processor);

      expect(registry.isSupported(".PDF")).toBe(true);
      expect(registry.isSupported(".Pdf")).toBe(true);
    });
  });
});
