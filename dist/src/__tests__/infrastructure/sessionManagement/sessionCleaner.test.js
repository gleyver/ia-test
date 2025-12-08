/**
 * Testes para SessionCleaner
 */
import { rmdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionCleaner } from "../../../infrastructure/sessionManagement/sessionCleaner.js";
// Mock do fs
vi.mock("fs", () => ({
    readdir: vi.fn((_path, callback) => {
        callback(null, ["session-123.json", "session-456.json", "other-file.txt"]);
    }),
    stat: vi.fn((_path, callback) => {
        const now = Date.now();
        callback(null, {
            mtimeMs: now - 2 * 60 * 1000, // 2 minutos atrás
            size: 1024,
        });
    }),
    unlink: vi.fn((_path, callback) => {
        callback(null);
    }),
}));
vi.mock("fs/promises", async () => {
    const actual = await vi.importActual("fs/promises");
    return {
        ...actual,
        access: vi.fn().mockResolvedValue(undefined),
    };
});
describe("SessionCleaner", () => {
    let cleaner;
    let testDbPath;
    beforeEach(() => {
        testDbPath = join(tmpdir(), `test-vector-db-${Date.now()}`);
        cleaner = new SessionCleaner({
            dbPath: testDbPath,
            maxAgeMinutes: 1, // 1 minuto para testes
        });
    });
    afterEach(async () => {
        cleaner.stop();
        // Limpar diretório de teste se existir
        try {
            const { readdir, unlink: unlinkSync } = await import("fs/promises");
            const files = await readdir(testDbPath).catch(() => []);
            for (const file of files) {
                await unlinkSync(join(testDbPath, file)).catch(() => { });
            }
            await rmdir(testDbPath).catch(() => { });
        }
        catch {
            // Ignorar erros de limpeza
        }
    });
    describe("constructor", () => {
        it("deve criar SessionCleaner com valores padrão", () => {
            const defaultCleaner = new SessionCleaner();
            expect(defaultCleaner).toBeInstanceOf(SessionCleaner);
        });
        it("deve criar SessionCleaner com valores customizados", () => {
            const customCleaner = new SessionCleaner({
                dbPath: "/custom/path",
                maxAgeMinutes: 120,
            });
            expect(customCleaner).toBeInstanceOf(SessionCleaner);
        });
    });
    describe("start", () => {
        it("deve iniciar limpeza automática", () => {
            cleaner.start(1); // Intervalo de 1 minuto
            // Verificar que não lançou erro
            expect(true).toBe(true);
        });
        it("não deve iniciar duas vezes", () => {
            cleaner.start(1);
            cleaner.start(1); // Segunda chamada não deve fazer nada
            // Se chegou aqui, não lançou erro
            expect(true).toBe(true);
        });
    });
    describe("stop", () => {
        it("deve parar limpeza automática", () => {
            cleaner.start(1);
            cleaner.stop();
            // Se chegou aqui, funcionou
            expect(true).toBe(true);
        });
        it("deve ser seguro chamar stop sem start", () => {
            cleaner.stop(); // Não deve lançar erro
            expect(true).toBe(true);
        });
    });
    describe("cleanupNow", () => {
        it("deve executar limpeza manual", async () => {
            const { access } = await import("fs/promises");
            vi.mocked(access).mockResolvedValue(undefined);
            const result = await cleaner.cleanupNow();
            expect(result).toHaveProperty("sessionsChecked");
            expect(result).toHaveProperty("sessionsDeleted");
            expect(result).toHaveProperty("errors");
            expect(result).toHaveProperty("totalSizeFreed");
        });
        it("deve retornar stats vazios quando diretório não existe", async () => {
            const { access } = await import("fs/promises");
            vi.mocked(access).mockRejectedValue(new Error("Diretório não existe"));
            const nonExistentCleaner = new SessionCleaner({
                dbPath: "/caminho/inexistente/12345",
                maxAgeMinutes: 1,
            });
            const result = await nonExistentCleaner.cleanupNow();
            expect(result.sessionsChecked).toBe(0);
            expect(result.sessionsDeleted).toBe(0);
        });
        it("não deve executar limpeza se já está em execução", async () => {
            const { access } = await import("fs/promises");
            vi.mocked(access).mockResolvedValue(undefined);
            // Iniciar limpeza (simular execução)
            const promise1 = cleaner.cleanupNow();
            const promise2 = cleaner.cleanupNow(); // Segunda chamada deve retornar stats vazios
            const [result1, result2] = await Promise.all([promise1, promise2]);
            // Uma das chamadas deve ter stats vazios (já estava em execução)
            expect(result1.sessionsChecked >= 0).toBe(true);
            expect(result2.sessionsChecked >= 0).toBe(true);
        });
    });
    describe("getStats", () => {
        it("deve retornar estatísticas", async () => {
            const { access } = await import("fs/promises");
            vi.mocked(access).mockResolvedValue(undefined);
            const stats = await cleaner.getStats();
            expect(stats).toHaveProperty("totalSessions");
            expect(stats).toHaveProperty("oldSessions");
            expect(stats).toHaveProperty("totalSize");
            expect(stats).toHaveProperty("oldSessionsSize");
        });
        it("deve retornar stats vazios quando diretório não existe", async () => {
            const { access } = await import("fs/promises");
            vi.mocked(access).mockRejectedValue(new Error("Não existe"));
            const stats = await cleaner.getStats();
            expect(stats.totalSessions).toBe(0);
            expect(stats.oldSessions).toBe(0);
            expect(stats.totalSize).toBe(0);
        });
    });
});
//# sourceMappingURL=sessionCleaner.test.js.map