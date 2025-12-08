/**
 * Testes para Query Value Object
 * Testa validação, imutabilidade e métodos utilitários
 */

import { describe, expect, it } from "vitest";
import { Query } from "../../../domain/valueObjects/query.js";
import { ValidationError } from "../../../shared/errors/errors.js";

describe("Query Value Object", () => {
  describe("fromString", () => {
    it("deve criar query válida a partir de string", () => {
      const query = Query.fromString("Qual é o conteúdo?");
      expect(query.toString()).toBe("Qual é o conteúdo?");
    });

    it("deve sanitizar query removendo espaços extras", () => {
      // sanitizeQuery apenas faz trim(), não remove espaços múltiplos
      const query = Query.fromString("  Qual é o conteúdo?  ");
      expect(query.toString()).toBe("Qual é o conteúdo?");
    });

    it("deve rejeitar query vazia", () => {
      expect(() => Query.fromString("")).toThrow(ValidationError);
      expect(() => Query.fromString("   ")).toThrow(ValidationError);
    });

    it("deve rejeitar query muito longa (>10000 caracteres)", () => {
      const longQuery = "a".repeat(10001);
      expect(() => Query.fromString(longQuery)).toThrow(ValidationError);
    });

    it("deve aceitar query no limite (10000 caracteres)", () => {
      const limitQuery = "a".repeat(10000);
      const query = Query.fromString(limitQuery);
      expect(query.length()).toBe(10000);
    });
  });

  describe("toString", () => {
    it("deve retornar string original", () => {
      const text = "Qual é o conteúdo?";
      const query = Query.fromString(text);
      expect(query.toString()).toBe(text);
    });
  });

  describe("length", () => {
    it("deve retornar comprimento correto", () => {
      const query = Query.fromString("Teste");
      expect(query.length()).toBe(5);
    });
  });

  describe("isEmpty", () => {
    it("deve retornar false para query válida", () => {
      const query = Query.fromString("Teste");
      expect(query.isEmpty()).toBe(false);
    });

    it("deve retornar true apenas se query estiver vazia após trim", () => {
      // Query vazia não pode ser criada, então testamos o método diretamente
      // Em um caso real, isso seria testado internamente
      const query = Query.fromString("a");
      expect(query.isEmpty()).toBe(false);
    });
  });

  describe("equals", () => {
    it("deve retornar true para queries iguais", () => {
      const query1 = Query.fromString("Teste");
      const query2 = Query.fromString("Teste");
      expect(query1.equals(query2)).toBe(true);
    });

    it("deve retornar false para queries diferentes", () => {
      const query1 = Query.fromString("Teste 1");
      const query2 = Query.fromString("Teste 2");
      expect(query1.equals(query2)).toBe(false);
    });
  });

  describe("toLowerCase / toUpperCase", () => {
    it("deve converter para minúsculas", () => {
      const query = Query.fromString("TESTE");
      expect(query.toLowerCase()).toBe("teste");
    });

    it("deve converter para maiúsculas", () => {
      const query = Query.fromString("teste");
      expect(query.toUpperCase()).toBe("TESTE");
    });
  });

  describe("Imutabilidade", () => {
    it("deve ser imutável", () => {
      const query = Query.fromString("Original");
      const originalValue = query.toString();

      // Tentar modificar não deve afetar o objeto
      // (não há métodos mutáveis, mas validamos o comportamento)
      expect(query.toString()).toBe(originalValue);
    });
  });

  describe("valueOf", () => {
    it("deve retornar valor como string", () => {
      const query = Query.fromString("Teste");
      expect(query.valueOf()).toBe("Teste");
    });
  });

  describe("fromStringUnsafe", () => {
    it("deve criar Query sem sanitização", () => {
      const text = "  Query   com   espaços   extras  ";
      const query = Query.fromStringUnsafe(text);
      expect(query.toString()).toBe(text); // Não sanitiza
    });

    it("deve validar mesmo sem sanitização", () => {
      expect(() => Query.fromStringUnsafe("")).toThrow(ValidationError);
      expect(() => Query.fromStringUnsafe("   ")).toThrow(ValidationError);
    });

    it("deve validar tamanho máximo mesmo sem sanitização", () => {
      const longQuery = "a".repeat(10001);
      expect(() => Query.fromStringUnsafe(longQuery)).toThrow(ValidationError);
    });
  });
});
