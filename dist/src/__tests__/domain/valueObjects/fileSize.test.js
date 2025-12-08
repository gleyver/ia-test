/**
 * Testes para FileSize Value Object
 */
import { describe, expect, it } from "vitest";
import { FileSize } from "../../../domain/valueObjects/fileSize.js";
import { ValidationError } from "../../../shared/errors/errors.js";
describe("FileSize Value Object", () => {
    describe("fromBytes", () => {
        it("deve criar FileSize a partir de bytes", () => {
            const fileSize = FileSize.fromBytes(1024);
            expect(fileSize.toBytes()).toBe(1024);
        });
        it("deve rejeitar valor negativo", () => {
            expect(() => FileSize.fromBytes(-1)).toThrow(ValidationError);
        });
        it("deve rejeitar valor não finito", () => {
            expect(() => FileSize.fromBytes(Infinity)).toThrow(ValidationError);
            expect(() => FileSize.fromBytes(-Infinity)).toThrow(ValidationError);
            expect(() => FileSize.fromBytes(NaN)).toThrow(ValidationError);
        });
        it("deve aceitar zero", () => {
            const fileSize = FileSize.fromBytes(0);
            expect(fileSize.toBytes()).toBe(0);
        });
    });
    describe("fromMB", () => {
        it("deve criar FileSize a partir de MB", () => {
            const fileSize = FileSize.fromMB(1);
            expect(fileSize.toBytes()).toBe(1024 * 1024);
        });
        it("deve criar FileSize a partir de MB decimais", () => {
            const fileSize = FileSize.fromMB(1.5);
            expect(fileSize.toBytes()).toBe(1.5 * 1024 * 1024);
        });
    });
    describe("toBytes", () => {
        it("deve retornar tamanho em bytes", () => {
            const fileSize = FileSize.fromBytes(2048);
            expect(fileSize.toBytes()).toBe(2048);
        });
    });
    describe("toKB", () => {
        it("deve retornar tamanho em KB", () => {
            const fileSize = FileSize.fromBytes(2048);
            expect(fileSize.toKB()).toBe(2);
        });
    });
    describe("toMB", () => {
        it("deve retornar tamanho em MB", () => {
            const fileSize = FileSize.fromBytes(2 * 1024 * 1024);
            expect(fileSize.toMB()).toBe(2);
        });
    });
    describe("toGB", () => {
        it("deve retornar tamanho em GB", () => {
            const fileSize = FileSize.fromBytes(2 * 1024 * 1024 * 1024);
            expect(fileSize.toGB()).toBe(2);
        });
    });
    describe("toFormattedString", () => {
        it("deve formatar bytes (< 1KB)", () => {
            const fileSize = FileSize.fromBytes(512);
            expect(fileSize.toFormattedString()).toBe("512 B");
        });
        it("deve formatar KB", () => {
            const fileSize = FileSize.fromBytes(2048);
            expect(fileSize.toFormattedString()).toBe("2.00 KB");
        });
        it("deve formatar MB", () => {
            const fileSize = FileSize.fromBytes(2 * 1024 * 1024);
            expect(fileSize.toFormattedString()).toBe("2.00 MB");
        });
        it("deve formatar GB", () => {
            const fileSize = FileSize.fromBytes(2 * 1024 * 1024 * 1024);
            expect(fileSize.toFormattedString()).toBe("2.00 GB");
        });
    });
    describe("exceedsMax", () => {
        it("deve retornar false para tamanho dentro do limite", () => {
            const fileSize = FileSize.fromBytes(10 * 1024 * 1024); // 10 MB
            expect(fileSize.exceedsMax()).toBe(false);
        });
        it("deve retornar true para tamanho acima do limite", () => {
            const fileSize = FileSize.fromBytes(60 * 1024 * 1024); // 60 MB
            expect(fileSize.exceedsMax()).toBe(true);
        });
        it("deve retornar false para tamanho no limite", () => {
            const fileSize = FileSize.fromBytes(FileSize.MAX_BYTES);
            expect(fileSize.exceedsMax()).toBe(false);
        });
    });
    describe("equals", () => {
        it("deve retornar true para FileSizes iguais", () => {
            const fileSize1 = FileSize.fromBytes(1024);
            const fileSize2 = FileSize.fromBytes(1024);
            expect(fileSize1.equals(fileSize2)).toBe(true);
        });
        it("deve retornar false para FileSizes diferentes", () => {
            const fileSize1 = FileSize.fromBytes(1024);
            const fileSize2 = FileSize.fromBytes(2048);
            expect(fileSize1.equals(fileSize2)).toBe(false);
        });
    });
    describe("isGreaterThan", () => {
        it("deve retornar true quando maior", () => {
            const fileSize1 = FileSize.fromBytes(2048);
            const fileSize2 = FileSize.fromBytes(1024);
            expect(fileSize1.isGreaterThan(fileSize2)).toBe(true);
        });
        it("deve retornar false quando menor ou igual", () => {
            const fileSize1 = FileSize.fromBytes(1024);
            const fileSize2 = FileSize.fromBytes(2048);
            expect(fileSize1.isGreaterThan(fileSize2)).toBe(false);
            const fileSize3 = FileSize.fromBytes(1024);
            expect(fileSize1.isGreaterThan(fileSize3)).toBe(false);
        });
    });
    describe("isLessThan", () => {
        it("deve retornar true quando menor", () => {
            const fileSize1 = FileSize.fromBytes(1024);
            const fileSize2 = FileSize.fromBytes(2048);
            expect(fileSize1.isLessThan(fileSize2)).toBe(true);
        });
        it("deve retornar false quando maior ou igual", () => {
            const fileSize1 = FileSize.fromBytes(2048);
            const fileSize2 = FileSize.fromBytes(1024);
            expect(fileSize1.isLessThan(fileSize2)).toBe(false);
            const fileSize3 = FileSize.fromBytes(2048);
            expect(fileSize1.isLessThan(fileSize3)).toBe(false);
        });
    });
});
//# sourceMappingURL=fileSize.test.js.map