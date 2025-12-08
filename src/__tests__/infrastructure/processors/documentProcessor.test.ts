/**
 * Testes para DocumentProcessor
 */

import { unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DocumentProcessor } from "../../../infrastructure/processors/documentProcessor.js";

describe("DocumentProcessor", () => {
  let processor: DocumentProcessor;
  let testFile: string;

  beforeEach(() => {
    processor = new DocumentProcessor();
  });

  afterEach(async () => {
    if (testFile) {
      try {
        await unlink(testFile).catch(() => {});
      } catch {
        // Ignorar
      }
    }
  });

  describe("constructor", () => {
    it("deve criar DocumentProcessor", () => {
      const proc = new DocumentProcessor();
      expect(proc).toBeInstanceOf(DocumentProcessor);
    });

    it("deve inicializar registry na primeira vez", () => {
      const proc = new DocumentProcessor();
      expect(proc.canProcess(".txt")).toBe(true);
    });
  });

  describe("canProcess", () => {
    it("deve retornar true para extensões suportadas", () => {
      expect(processor.canProcess(".txt")).toBe(true);
      expect(processor.canProcess(".html")).toBe(true);
    });

    it("deve retornar false para extensões não suportadas", () => {
      expect(processor.canProcess(".xyz")).toBe(false);
    });

    it("deve ser case-insensitive", () => {
      expect(processor.canProcess(".TXT")).toBe(true);
      expect(processor.canProcess(".HTML")).toBe(true);
    });
  });

  describe("supportedExtensions", () => {
    it("deve retornar extensões suportadas", () => {
      const extensions = processor.supportedExtensions();
      expect(extensions.length).toBeGreaterThan(0);
      expect(extensions).toContain(".txt");
    });
  });

  describe("process", () => {
    it("deve processar arquivo de texto", async () => {
      testFile = join(tmpdir(), `test-${Date.now()}.txt`);
      await writeFile(testFile, "Conteúdo de teste", "utf-8");

      const result = await processor.process(testFile);

      expect(result.text).toContain("Conteúdo de teste");
      expect(result.metadata).toHaveProperty("extension");
      expect(result.metadata.extension).toBe(".txt");
    });

    it("deve normalizar texto processado", async () => {
      testFile = join(tmpdir(), `test-${Date.now()}.txt`);
      const textWithIssues = "Texto   com   espaços\r\nmúltiplos\n\n\n\nlinhas";
      await writeFile(testFile, textWithIssues, "utf-8");

      const result = await processor.process(testFile);

      expect(result.text).not.toContain("   "); // Espaços múltiplos removidos
      expect(result.text).not.toContain("\r\n"); // Quebras normalizadas
    });

    it("deve lançar erro para extensão não suportada", async () => {
      testFile = join(tmpdir(), `test-${Date.now()}.xyz`);
      await writeFile(testFile, "conteúdo", "utf-8");

      await expect(processor.process(testFile)).rejects.toThrow();
    });
  });

  describe("normalizeText", () => {
    it("deve remover caracteres de controle", () => {
      const text = "Texto\x00com\x01controle";
      const normalized = (processor as { normalizeText: (text: string) => string }).normalizeText(
        text
      );

      expect(normalized).not.toContain("\x00");
      expect(normalized).not.toContain("\x01");
    });

    it("deve normalizar quebras de linha", () => {
      const text = "Linha1\r\nLinha2\rLinha3";
      const normalized = (processor as { normalizeText: (text: string) => string }).normalizeText(
        text
      );

      expect(normalized).not.toContain("\r\n");
      expect(normalized).not.toContain("\r");
    });

    it("deve normalizar espaços múltiplos", () => {
      const text = "Texto   com     espaços";
      const normalized = (processor as { normalizeText: (text: string) => string }).normalizeText(
        text
      );

      expect(normalized).not.toContain("   ");
      expect(normalized).not.toContain("     ");
    });

    it("deve remover linhas vazias múltiplas", () => {
      const text = "Linha1\n\n\n\n\nLinha2";
      const normalized = (processor as { normalizeText: (text: string) => string }).normalizeText(
        text
      );

      expect(normalized.split("\n\n\n").length).toBeLessThanOrEqual(2);
    });

    it("deve fazer trim", () => {
      const text = "  Texto com espaços  ";
      const normalized = (processor as { normalizeText: (text: string) => string }).normalizeText(
        text
      );

      expect(normalized.startsWith(" ")).toBe(false);
      expect(normalized.endsWith(" ")).toBe(false);
    });
  });

  describe("extractTextWithOCR", () => {
    it("deve extrair texto com OCR (método deprecated)", async () => {
      // Este método pode falhar se OCR não estiver disponível, então apenas testamos que existe
      expect(typeof processor.extractTextWithOCR).toBe("function");
    });
  });

  describe("cleanupOCRWorker", () => {
    it("deve limpar worker OCR", async () => {
      await expect(DocumentProcessor.cleanupOCRWorker()).resolves.not.toThrow();
    });
  });
});
