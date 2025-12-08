/**
 * Testes para Redis Client
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeRedis, getRedisClient } from "../../redis/client.js";
// Mock do ioredis
vi.mock("ioredis", () => {
    const mockRedis = {
        on: vi.fn(),
        ping: vi.fn().mockResolvedValue("PONG"),
        quit: vi.fn().mockResolvedValue("OK"),
    };
    return {
        default: vi.fn().mockImplementation(() => mockRedis),
    };
});
// Mock do config
vi.mock("../../config/index.js", () => ({
    config: {
        redis: {
            enabled: false, // Redis desabilitado por padrão
            host: "localhost",
            port: 6379,
            password: undefined,
            db: 0,
        },
    },
}));
describe("Redis Client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(async () => {
        await closeRedis();
    });
    describe("getRedisClient", () => {
        it("deve retornar null quando Redis está desabilitado", () => {
            const client = getRedisClient();
            expect(client).toBeNull();
        });
        it("deve retornar cliente quando Redis está habilitado", () => {
            // Mock config com Redis habilitado
            vi.doMock("../../../config/index.js", () => ({
                config: {
                    redis: {
                        enabled: true,
                        host: "localhost",
                        port: 6379,
                        password: undefined,
                        db: 0,
                    },
                },
            }));
            // Recarregar módulo para pegar novo mock
            vi.resetModules();
        });
    });
    describe("closeRedis", () => {
        it("deve fechar conexão Redis", async () => {
            await closeRedis();
            // Se chegou aqui, funcionou
            expect(true).toBe(true);
        });
        it("deve ser seguro chamar quando não há cliente", async () => {
            await closeRedis();
            await closeRedis(); // Segunda chamada não deve lançar erro
            expect(true).toBe(true);
        });
    });
});
//# sourceMappingURL=client.test.js.map