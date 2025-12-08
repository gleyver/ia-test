/**
 * Testes para DocumentId Value Object
 */
import { describe, expect, it } from "vitest";
import { DocumentId } from "../../../domain/valueObjects/documentId.js";
import { ValidationError } from "../../../shared/errors/errors.js";
describe("DocumentId Value Object", () => {
    describe("fromString", () => {
        it("deve criar DocumentId válido a partir de string", () => {
            const id = "document-123";
            const documentId = DocumentId.fromString(id);
            expect(documentId.toString()).toBe(id);
        });
        it("deve rejeitar string vazia", () => {
            expect(() => DocumentId.fromString("")).toThrow(ValidationError);
            expect(() => DocumentId.fromString("   ")).toThrow(ValidationError);
        });
        it("deve rejeitar string muito longa (>255 caracteres)", () => {
            const longId = "a".repeat(256);
            expect(() => DocumentId.fromString(longId)).toThrow(ValidationError);
        });
        it("deve aceitar string no limite (255 caracteres)", () => {
            const limitId = "a".repeat(255);
            const documentId = DocumentId.fromString(limitId);
            expect(documentId.toString().length).toBe(255);
        });
    });
    describe("generate", () => {
        it("deve gerar DocumentId único", () => {
            const documentId1 = DocumentId.generate();
            const documentId2 = DocumentId.generate();
            expect(documentId1.toString()).not.toBe(documentId2.toString());
        });
        it("deve gerar DocumentId com formato timestamp-random", () => {
            const documentId = DocumentId.generate();
            const parts = documentId.toString().split("-");
            expect(parts.length).toBeGreaterThanOrEqual(2);
            expect(Number.parseInt(parts[0], 10)).toBeGreaterThan(0);
        });
    });
    describe("toString", () => {
        it("deve retornar ID como string", () => {
            const id = "document-123";
            const documentId = DocumentId.fromString(id);
            expect(documentId.toString()).toBe(id);
        });
    });
    describe("valueOf", () => {
        it("deve retornar valor como string", () => {
            const id = "document-123";
            const documentId = DocumentId.fromString(id);
            expect(documentId.valueOf()).toBe(id);
        });
    });
    describe("equals", () => {
        it("deve retornar true para DocumentIds iguais", () => {
            const id = "document-123";
            const documentId1 = DocumentId.fromString(id);
            const documentId2 = DocumentId.fromString(id);
            expect(documentId1.equals(documentId2)).toBe(true);
        });
        it("deve retornar false para DocumentIds diferentes", () => {
            const documentId1 = DocumentId.fromString("doc-1");
            const documentId2 = DocumentId.fromString("doc-2");
            expect(documentId1.equals(documentId2)).toBe(false);
        });
    });
});
//# sourceMappingURL=documentId.test.js.map