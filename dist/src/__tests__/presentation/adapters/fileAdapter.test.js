/**
 * Testes para FileAdapter
 */
import { beforeEach, describe, expect, it } from "vitest";
import { FileAdapter } from "../../../presentation/adapters/fileAdapter.js";
import { createTestFile } from "../../helpers/factories.js";
describe("FileAdapter", () => {
    let adapter;
    beforeEach(() => {
        adapter = new FileAdapter();
    });
    describe("toFileLike", () => {
        it("deve retornar FileLike quando já é FileLike", () => {
            const fileLike = createTestFile("test.pdf", "conteúdo");
            const result = adapter.toFileLike(fileLike);
            expect(result).toBe(fileLike);
            expect(result.name).toBe("test.pdf");
            expect(result.size).toBeGreaterThan(0);
        });
        it("deve converter File (Web API) para FileLike quando File está disponível", () => {
            // Mock File constructor globalmente
            const MockFile = class {
                name;
                size;
                type;
                arrayBuffer;
                constructor(name, size, type, arrayBuffer) {
                    this.name = name;
                    this.size = size;
                    this.type = type;
                    this.arrayBuffer = arrayBuffer;
                }
            };
            // Simular ambiente com File disponível
            const originalFile = global.File;
            global.File = MockFile;
            const webFile = new MockFile("test.pdf", 1024, "application/pdf", async () => new ArrayBuffer(1024));
            const result = adapter.toFileLike(webFile);
            expect(result.name).toBe("test.pdf");
            expect(result.size).toBe(1024);
            expect(result.type).toBe("application/pdf");
            expect(result.arrayBuffer).toBeDefined();
            // Restaurar
            global.File = originalFile;
        });
        it("não deve converter quando File não está disponível", () => {
            const fileLike = createTestFile("test.pdf", "conteúdo");
            const result = adapter.toFileLike(fileLike);
            // Deve retornar o mesmo objeto
            expect(result).toBe(fileLike);
        });
        it("deve preservar propriedades do FileLike", async () => {
            const fileLike = {
                name: "test.pdf",
                size: 1024,
                type: "application/pdf",
                tempPath: "/tmp/test.pdf",
                arrayBuffer: async () => new ArrayBuffer(1024),
            };
            const result = adapter.toFileLike(fileLike);
            expect(result.name).toBe("test.pdf");
            expect(result.size).toBe(1024);
            expect(result.type).toBe("application/pdf");
            expect(result.tempPath).toBe("/tmp/test.pdf");
        });
    });
});
//# sourceMappingURL=fileAdapter.test.js.map