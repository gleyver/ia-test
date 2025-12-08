/**
 * Testes para errors
 */

import { describe, expect, it } from "vitest";
import {
  AppError,
  NotFoundError,
  ProcessingError,
  RateLimitError,
  ValidationError,
} from "../../../shared/errors/errors.js";

describe("errors", () => {
  describe("AppError", () => {
    it("deve criar AppError com mensagem e código", () => {
      const error = new AppError("Erro de teste", "TEST_ERROR");

      expect(error.message).toBe("Erro de teste");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("AppError");
    });

    it("deve criar AppError com statusCode customizado", () => {
      const error = new AppError("Erro de teste", "TEST_ERROR", 404);

      expect(error.statusCode).toBe(404);
    });

    it("deve criar AppError com detalhes", () => {
      const details = { field: "email", reason: "invalid" };
      const error = new AppError("Erro de teste", "TEST_ERROR", 400, details);

      expect(error.details).toEqual(details);
    });

    it("deve converter para JSON", () => {
      const error = new AppError("Erro de teste", "TEST_ERROR", 400, { field: "email" });
      const json = error.toJSON();

      expect(json).toHaveProperty("error", "Erro de teste");
      expect(json).toHaveProperty("code", "TEST_ERROR");
      expect(json).toHaveProperty("details");
    });

    it("deve converter para JSON sem detalhes", () => {
      const error = new AppError("Erro de teste", "TEST_ERROR");
      const json = error.toJSON();

      expect(json).not.toHaveProperty("details");
    });
  });

  describe("ValidationError", () => {
    it("deve criar ValidationError", () => {
      const error = new ValidationError("Validação falhou");

      expect(error.message).toBe("Validação falhou");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("ValidationError");
    });

    it("deve criar ValidationError com detalhes", () => {
      const details = { field: "email" };
      const error = new ValidationError("Validação falhou", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("ProcessingError", () => {
    it("deve criar ProcessingError", () => {
      const error = new ProcessingError("Processamento falhou");

      expect(error.message).toBe("Processamento falhou");
      expect(error.code).toBe("PROCESSING_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("ProcessingError");
    });
  });

  describe("NotFoundError", () => {
    it("deve criar NotFoundError", () => {
      const error = new NotFoundError("Recurso não encontrado");

      expect(error.message).toBe("Recurso não encontrado");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });
  });

  describe("RateLimitError", () => {
    it("deve criar RateLimitError com mensagem padrão", () => {
      const error = new RateLimitError();

      expect(error.message).toBe("Muitas requisições. Tente novamente mais tarde.");
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe("RateLimitError");
    });

    it("deve criar RateLimitError com mensagem customizada", () => {
      const error = new RateLimitError("Limite excedido");

      expect(error.message).toBe("Limite excedido");
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.statusCode).toBe(429);
    });
  });
});
