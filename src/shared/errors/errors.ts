/**
 * Erros estruturados do sistema RAG
 * Facilita rastreamento e tratamento de erros
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const result: Record<string, unknown> = {
      error: this.message,
      code: this.code,
    };
    if (this.details) {
      result.details = this.details;
    }
    return result;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "PROCESSING_ERROR", 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = "Muitas requisições. Tente novamente mais tarde.",
    details?: unknown
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, details);
  }
}
