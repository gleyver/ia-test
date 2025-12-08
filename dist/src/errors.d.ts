/**
 * Erros estruturados do sistema RAG
 * Facilita rastreamento e tratamento de erros
 */
export declare class AppError extends Error {
  code: string;
  statusCode: number;
  details?: unknown | undefined;
  constructor(message: string, code: string, statusCode?: number, details?: unknown | undefined);
  toJSON(): Record<string, unknown>;
}
export declare class ValidationError extends AppError {
  constructor(message: string, details?: unknown);
}
export declare class ProcessingError extends AppError {
  constructor(message: string, details?: unknown);
}
export declare class NotFoundError extends AppError {
  constructor(message: string, details?: unknown);
}
export declare class RateLimitError extends AppError {
  constructor(message?: string, details?: unknown);
}
//# sourceMappingURL=errors.d.ts.map
