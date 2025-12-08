/**
 * Testes para utils
 */

import { describe, expect, it } from "vitest";
import { calculateNorm, cosineSimilarity, euclideanDistance } from "../../../shared/utils/utils.js";
import { createTestEmbedding } from "../../helpers/factories.js";

describe("utils", () => {
  describe("cosineSimilarity", () => {
    it("deve calcular similaridade de cosseno", () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const similarity = cosineSimilarity(vecA, vecB);

      expect(similarity).toBeCloseTo(1, 5);
    });

    it("deve calcular similaridade para vetores ortogonais", () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      const similarity = cosineSimilarity(vecA, vecB);

      expect(similarity).toBeCloseTo(0, 5);
    });

    it("deve usar norms pré-computados", () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const normA = calculateNorm(vecA);
      const normB = calculateNorm(vecB);

      const similarity = cosineSimilarity(vecA, vecB, normA, normB);

      expect(similarity).toBeCloseTo(1, 5);
    });

    it("deve calcular norms se não fornecidos", () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];

      const similarity = cosineSimilarity(vecA, vecB);

      expect(similarity).toBeCloseTo(1, 5);
    });

    it("deve retornar 0 para similaridade muito baixa (early exit)", () => {
      const vecA = createTestEmbedding(384, 0.5);
      const vecB = createTestEmbedding(384, -0.5); // Vetores opostos

      const similarity = cosineSimilarity(Array.from(vecA), Array.from(vecB));

      // Pode retornar 0 devido ao early exit ou valor negativo baixo
      expect(similarity).toBeLessThanOrEqual(0.1);
    });

    it("deve retornar 0 quando denominador é zero", () => {
      const vecA = [0, 0, 0];
      const vecB = [0, 0, 0];

      const similarity = cosineSimilarity(vecA, vecB);

      expect(similarity).toBe(0);
    });

    it("deve lançar erro para vetores de tamanhos diferentes", () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2];

      expect(() => cosineSimilarity(vecA, vecB)).toThrow("Vetores devem ter o mesmo tamanho");
    });
  });

  describe("calculateNorm", () => {
    it("deve calcular norm de vetor", () => {
      const vec = [3, 4, 0];
      const norm = calculateNorm(vec);

      // Norm = 3² + 4² + 0² = 9 + 16 = 25 (sem sqrt)
      expect(norm).toBe(25);
    });

    it("deve calcular norm de vetor zero", () => {
      const vec = [0, 0, 0];
      const norm = calculateNorm(vec);

      expect(norm).toBe(0);
    });

    it("deve calcular norm de vetor grande", () => {
      const vec = createTestEmbedding(384, 0.5);
      const norm = calculateNorm(Array.from(vec));

      expect(norm).toBeGreaterThan(0);
    });
  });

  describe("euclideanDistance", () => {
    it("deve calcular distância euclidiana", () => {
      const vecA = [0, 0, 0];
      const vecB = [3, 4, 0];
      const distance = euclideanDistance(vecA, vecB);

      // Distância = sqrt(3² + 4² + 0²) = sqrt(25) = 5
      expect(distance).toBeCloseTo(5, 5);
    });

    it("deve calcular distância zero para vetores iguais", () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2, 3];
      const distance = euclideanDistance(vecA, vecB);

      expect(distance).toBe(0);
    });

    it("deve lançar erro para vetores de tamanhos diferentes", () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2];

      expect(() => euclideanDistance(vecA, vecB)).toThrow("Vetores devem ter o mesmo tamanho");
    });

    it("deve calcular distância para vetores grandes", () => {
      const vecA = createTestEmbedding(384, 0.5);
      const vecB = createTestEmbedding(384, 0.3);
      const distance = euclideanDistance(Array.from(vecA), Array.from(vecB));

      expect(distance).toBeGreaterThan(0);
    });
  });
});
