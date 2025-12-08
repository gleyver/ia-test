/**
 * Testes para SessionId Value Object
 */
import { describe, expect, it } from "vitest";
import { SessionId } from "../../../domain/valueObjects/sessionId.js";
import { ValidationError } from "../../../shared/errors/errors.js";
describe("SessionId Value Object", () => {
    describe("fromString", () => {
        it("deve criar SessionId válido a partir de UUID", () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            const sessionId = SessionId.fromString(uuid);
            expect(sessionId.toString()).toBe(uuid);
        });
        it("deve rejeitar string vazia", () => {
            expect(() => SessionId.fromString("")).toThrow(ValidationError);
            expect(() => SessionId.fromString("   ")).toThrow(ValidationError);
        });
        it("deve rejeitar UUID inválido", () => {
            expect(() => SessionId.fromString("not-a-uuid")).toThrow(ValidationError);
            expect(() => SessionId.fromString("550e8400")).toThrow(ValidationError);
            expect(() => SessionId.fromString("550e8400-e29b-41d4-a716")).toThrow(ValidationError);
        });
    });
    describe("generate", () => {
        it("deve gerar SessionId único", () => {
            const sessionId1 = SessionId.generate();
            const sessionId2 = SessionId.generate();
            expect(sessionId1.toString()).not.toBe(sessionId2.toString());
            expect(sessionId1.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });
        it("deve gerar SessionId válido (formato UUID)", () => {
            const sessionId = SessionId.generate();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(uuidRegex.test(sessionId.toString())).toBe(true);
        });
    });
    describe("toString", () => {
        it("deve retornar UUID como string", () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            const sessionId = SessionId.fromString(uuid);
            expect(sessionId.toString()).toBe(uuid);
        });
    });
    describe("valueOf", () => {
        it("deve retornar valor como string", () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            const sessionId = SessionId.fromString(uuid);
            expect(sessionId.valueOf()).toBe(uuid);
        });
    });
    describe("equals", () => {
        it("deve retornar true para SessionIds iguais", () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            const sessionId1 = SessionId.fromString(uuid);
            const sessionId2 = SessionId.fromString(uuid);
            expect(sessionId1.equals(sessionId2)).toBe(true);
        });
        it("deve retornar false para SessionIds diferentes", () => {
            const sessionId1 = SessionId.generate();
            const sessionId2 = SessionId.generate();
            expect(sessionId1.equals(sessionId2)).toBe(false);
        });
    });
});
//# sourceMappingURL=sessionId.test.js.map