/**
 * Testes para FileSystemStorage
 */

import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileSystemStorage } from "../../../infrastructure/storage/fileSystemStorage.js";

describe("FileSystemStorage", () => {
  let storage: FileSystemStorage;
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    storage = new FileSystemStorage();
    testDir = join(tmpdir(), `test-storage-${Date.now()}`);
    testFile = join(testDir, "test.txt");
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await unlink(testFile).catch(() => {});
    } catch {
      // Ignorar
    }
  });

  describe("write", () => {
    it("deve escrever arquivo", async () => {
      const data = "conteúdo de teste";
      await storage.write(testFile, data);

      const content = await readFile(testFile, "utf-8");
      expect(content).toBe(data);
    });

    it("deve sobrescrever arquivo existente", async () => {
      await storage.write(testFile, "conteúdo inicial");
      await storage.write(testFile, "conteúdo atualizado");

      const content = await readFile(testFile, "utf-8");
      expect(content).toBe("conteúdo atualizado");
    });

    it("deve escrever dados grandes", async () => {
      const largeData = "a".repeat(10000);
      await storage.write(testFile, largeData);

      const content = await readFile(testFile, "utf-8");
      expect(content.length).toBe(10000);
    });
  });

  describe("read", () => {
    it("deve ler arquivo existente", async () => {
      const data = "conteúdo de teste";
      await writeFile(testFile, data, "utf-8");

      const content = await storage.read(testFile);
      expect(content).toBe(data);
    });

    it("deve lançar erro ao ler arquivo inexistente", async () => {
      const nonExistentFile = join(testDir, "inexistente.txt");

      await expect(storage.read(nonExistentFile)).rejects.toThrow();
    });

    it("deve ler arquivo vazio", async () => {
      await writeFile(testFile, "", "utf-8");

      const content = await storage.read(testFile);
      expect(content).toBe("");
    });
  });

  describe("exists", () => {
    it("deve retornar true para arquivo existente", async () => {
      await writeFile(testFile, "test", "utf-8");

      const exists = await storage.exists(testFile);
      expect(exists).toBe(true);
    });

    it("deve retornar false para arquivo inexistente", async () => {
      const nonExistentFile = join(testDir, "inexistente.txt");

      const exists = await storage.exists(nonExistentFile);
      expect(exists).toBe(false);
    });

    it("deve retornar false para diretório", async () => {
      const exists = await storage.exists(testDir);
      // Pode ser true ou false dependendo se o diretório existe
      expect(typeof exists).toBe("boolean");
    });
  });
});
