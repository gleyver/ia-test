/**
 * Erros estruturados do sistema RAG
 * Facilita rastreamento e tratamento de erros
 */
export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        const result = {
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
    constructor(message, details) {
        super(message, "VALIDATION_ERROR", 400, details);
    }
}
export class ProcessingError extends AppError {
    constructor(message, details) {
        super(message, "PROCESSING_ERROR", 500, details);
    }
}
export class NotFoundError extends AppError {
    constructor(message, details) {
        super(message, "NOT_FOUND", 404, details);
    }
}
export class RateLimitError extends AppError {
    constructor(message = "Muitas requisições. Tente novamente mais tarde.", details) {
        super(message, "RATE_LIMIT_EXCEEDED", 429, details);
    }
}
//# sourceMappingURL=errors.js.map