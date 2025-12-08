/**
 * Testes para TextProcessor
 */

import { unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TextProcessor } from "../../../infrastructure/processors/textProcessor.js";

describe("TextProcessor", () => {
  let processor: TextProcessor;
  let tempFile: string;

  beforeEach(() => {
    processor = new TextProcessor();
  });

  afterEach(async () => {
    if (tempFile) {
      try {
        await unlink(tempFile);
      } catch {
        // Ignorar erro
      }
    }
  });

  describe("canProcess", () => {
    it("deve retornar true para .txt", () => {
      expect(processor.canProcess(".txt")).toBe(true);
      expect(processor.canProcess(".TXT")).toBe(true);
    });

    it("deve retornar true para .html", () => {
      expect(processor.canProcess(".html")).toBe(true);
      expect(processor.canProcess(".HTML")).toBe(true);
    });

    it("deve retornar true para .htm", () => {
      expect(processor.canProcess(".htm")).toBe(true);
    });

    it("deve retornar false para extensões não suportadas", () => {
      expect(processor.canProcess(".pdf")).toBe(false);
      expect(processor.canProcess(".docx")).toBe(false);
    });
  });

  describe("supportedExtensions", () => {
    it("deve retornar extensões suportadas", () => {
      const extensions = processor.supportedExtensions();
      expect(extensions).toContain(".txt");
      expect(extensions).toContain(".html");
      expect(extensions).toContain(".htm");
    });
  });

  describe("process", () => {
    it("deve processar arquivo .txt", async () => {
      const content = "Conteúdo de teste do arquivo TXT";
      tempFile = join(tmpdir(), `test-${Date.now()}.txt`);
      await writeFile(tempFile, content, "utf-8");

      const result = await processor.process(tempFile);

      expect(result.text).toBe(content);
      expect(result.metadata.extension).toBe(".txt");
      expect(result.metadata.filename).toBeDefined();
    });

    it("deve processar arquivo .html", async () => {
      const content = "<html><body>Conteúdo HTML</body></html>";
      tempFile = join(tmpdir(), `test-${Date.now()}.html`);
      await writeFile(tempFile, content, "utf-8");

      const result = await processor.process(tempFile);

      expect(result.text).toBe(content);
      expect(result.metadata.extension).toBe(".html");
    });

    it("deve remover espaços em branco no início e fim", async () => {
      const content = "  Conteúdo com espaços  ";
      tempFile = join(tmpdir(), `test-${Date.now()}.txt`);
      await writeFile(tempFile, content, "utf-8");

      const result = await processor.process(tempFile);

      expect(result.text).toBe("Conteúdo com espaços");
    });

    it("deve incluir metadata correta", async () => {
      const content = "Teste";
      tempFile = join(tmpdir(), `test-${Date.now()}.txt`);
      await writeFile(tempFile, content, "utf-8");

      const result = await processor.process(tempFile);

      expect(result.metadata).toHaveProperty("source");
      expect(result.metadata).toHaveProperty("filename");
      expect(result.metadata).toHaveProperty("extension");
    });
  });
});
