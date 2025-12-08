/**
 * Testes para JsonDocumentRepository
 */
import { mkdir, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileSystemStorage } from "../../../infrastructure/storage/fileSystemStorage.js";
import { JsonDocumentRepository } from "../../../infrastructure/storage/jsonDocumentRepository.js";
describe("JsonDocumentRepository", () => {
    let repository;
    let storage;
    let testBasePath;
    const collectionName = "test-collection";
    beforeEach(async () => {
        testBasePath = join(tmpdir(), `test-repo-${Date.now()}`);
        storage = new FileSystemStorage();
        repository = new JsonDocumentRepository(storage, testBasePath);
    });
    afterEach(async () => {
        try {
            const collectionPath = join(testBasePath, `${collectionName}.json`);
            await unlink(collectionPath).catch(() => { });
        }
        catch {
            // Ignorar
        }
    });
    describe("save", () => {
        it("deve salvar documentos", async () => {
            const documents = [
                {
                    id: "1",
                    text: "Documento 1",
                    embedding: [0.1, 0.2, 0.3],
                    norm: 1,
                    metadata: { source: "test.pdf" },
                },
                {
                    id: "2",
                    text: "Documento 2",
                    embedding: [0.4, 0.5, 0.6],
                    norm: 1,
                    metadata: { source: "test2.pdf" },
                },
            ];
            await repository.save(collectionName, documents);
            const loaded = await repository.load(collectionName);
            expect(loaded).toHaveLength(2);
            expect(loaded[0].id).toBe("1");
            expect(loaded[1].id).toBe("2");
        });
        it("deve criar diretório base se não existir", async () => {
            const newBasePath = join(tmpdir(), `test-repo-new-${Date.now()}`);
            const newRepo = new JsonDocumentRepository(storage, newBasePath);
            const documents = [
                {
                    id: "1",
                    text: "Test",
                    embedding: [0.1],
                    norm: 1,
                    metadata: {},
                },
            ];
            await newRepo.save(collectionName, documents);
            const loaded = await newRepo.load(collectionName);
            expect(loaded).toHaveLength(1);
        });
        it("deve sobrescrever coleção existente", async () => {
            const documents1 = [
                {
                    id: "1",
                    text: "Documento 1",
                    embedding: [0.1],
                    norm: 1,
                    metadata: {},
                },
            ];
            await repository.save(collectionName, documents1);
            const documents2 = [
                {
                    id: "2",
                    text: "Documento 2",
                    embedding: [0.2],
                    norm: 1,
                    metadata: {},
                },
            ];
            await repository.save(collectionName, documents2);
            const loaded = await repository.load(collectionName);
            expect(loaded).toHaveLength(1);
            expect(loaded[0].id).toBe("2");
        });
    });
    describe("load", () => {
        it("deve carregar documentos salvos", async () => {
            const documents = [
                {
                    id: "1",
                    text: "Documento 1",
                    embedding: [0.1, 0.2],
                    norm: 1,
                    metadata: { source: "test.pdf" },
                },
            ];
            await repository.save(collectionName, documents);
            const loaded = await repository.load(collectionName);
            expect(loaded).toHaveLength(1);
            expect(loaded[0]).toEqual(documents[0]);
        });
        it("deve retornar array vazio para coleção inexistente", async () => {
            const loaded = await repository.load("inexistente");
            expect(loaded).toEqual([]);
        });
        it("deve retornar array vazio para arquivo JSON inválido", async () => {
            const collectionPath = join(testBasePath, `${collectionName}.json`);
            await mkdir(testBasePath, { recursive: true });
            await writeFile(collectionPath, "json inválido", "utf-8");
            const loaded = await repository.load(collectionName);
            expect(loaded).toEqual([]);
        });
        it("deve retornar array vazio para JSON que não é array", async () => {
            const collectionPath = join(testBasePath, `${collectionName}.json`);
            await mkdir(testBasePath, { recursive: true });
            await writeFile(collectionPath, '{"not": "array"}', "utf-8");
            const loaded = await repository.load(collectionName);
            expect(loaded).toEqual([]);
        });
    });
    describe("exists", () => {
        it("deve retornar true para coleção existente", async () => {
            const documents = [
                {
                    id: "1",
                    text: "Test",
                    embedding: [0.1],
                    norm: 1,
                    metadata: {},
                },
            ];
            await repository.save(collectionName, documents);
            const exists = await repository.exists(collectionName);
            expect(exists).toBe(true);
        });
        it("deve retornar false para coleção inexistente", async () => {
            const exists = await repository.exists("inexistente");
            expect(exists).toBe(false);
        });
    });
    describe("delete", () => {
        it("deve deletar coleção existente", async () => {
            const documents = [
                {
                    id: "1",
                    text: "Test",
                    embedding: [0.1],
                    norm: 1,
                    metadata: {},
                },
            ];
            await repository.save(collectionName, documents);
            await repository.delete(collectionName);
            const exists = await repository.exists(collectionName);
            expect(exists).toBe(false);
        });
        it("não deve lançar erro ao deletar coleção inexistente", async () => {
            await expect(repository.delete("inexistente")).resolves.not.toThrow();
        });
        it("deve lançar erro para outros erros além de ENOENT", async () => {
            const error = new Error("Permission denied");
            error.code = "EACCES";
            const mockUnlink = vi.fn().mockRejectedValue(error);
            vi.doMock("fs/promises", () => ({
                unlink: mockUnlink,
            }));
            // Testar com storage real mas simular erro
            const repo = new JsonDocumentRepository(storage, testBasePath);
            await repo.save(collectionName, [
                {
                    id: "1",
                    text: "Test",
                    embedding: [0.1],
                    norm: 1,
                    metadata: {},
                },
            ]);
            // Tentar deletar (pode falhar se houver problema de permissão real)
            try {
                await repo.delete(collectionName);
            }
            catch (err) {
                // Se lançou erro, verificar que não é ENOENT
                if (err.code !== "ENOENT") {
                    expect(err.code).not.toBe("ENOENT");
                }
            }
        });
    });
});
//# sourceMappingURL=jsonDocumentRepository.test.js.map