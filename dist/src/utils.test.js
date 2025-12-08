/**
 * Testes unitários para funções utilitárias
 */
import { describe, expect, it } from "vitest";
import { calculateNorm, cosineSimilarity, euclideanDistance } from "./shared/utils/utils.js";
describe("Utils", () => {
    describe("cosineSimilarity", () => {
        it("deve retornar 1 para vetores idênticos", () => {
            const vec = [1, 2, 3];
            const similarity = cosineSimilarity(vec, vec);
            expect(similarity).toBeCloseTo(1, 5);
        });
        it("deve retornar 0 para vetores ortogonais", () => {
            const vec1 = [1, 0, 0];
            const vec2 = [0, 1, 0];
            const similarity = cosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(0, 5);
        });
        it("deve usar norms pré-computados quando fornecidos", () => {
            const vec1 = [1, 2, 3];
            const vec2 = [2, 4, 6];
            const norm1 = calculateNorm(vec1);
            const norm2 = calculateNorm(vec2);
            const similarity = cosineSimilarity(vec1, vec2, norm1, norm2);
            expect(similarity).toBeCloseTo(1, 5); // Vetores são proporcionais
        });
        it("deve lançar erro para vetores de tamanhos diferentes", () => {
            expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
        });
    });
    describe("calculateNorm", () => {
        it("deve calcular norm corretamente", () => {
            const vec = [3, 4]; // Norm = sqrt(9 + 16) = 5, mas retorna sum = 25
            const norm = calculateNorm(vec);
            expect(norm).toBe(25); // Retorna sum of squares, não sqrt
        });
        it("deve retornar 0 para vetor vazio", () => {
            const norm = calculateNorm([]);
            expect(norm).toBe(0);
        });
    });
    describe("euclideanDistance", () => {
        it("deve calcular distância corretamente", () => {
            const vec1 = [0, 0];
            const vec2 = [3, 4];
            const distance = euclideanDistance(vec1, vec2);
            expect(distance).toBe(5); // sqrt(9 + 16) = 5
        });
        it("deve retornar 0 para vetores idênticos", () => {
            const vec = [1, 2, 3];
            const distance = euclideanDistance(vec, vec);
            expect(distance).toBe(0);
        });
    });
});
//# sourceMappingURL=utils.test.js.map