/**
 * Value Object para query de busca
 * Garante imutabilidade, validação e sanitização
 */
import { sanitizeQuery } from "../../domain/validators.js";
import { ValidationError } from "../../shared/errors/errors.js";
/**
 * Value Object para query de busca
 */
export class Query {
    value;
    constructor(value) {
        this.value = value;
        if (!value || value.trim().length === 0) {
            throw new ValidationError("Query não pode ser vazia");
        }
        if (value.length > 10000) {
            throw new ValidationError("Query não pode ter mais de 10000 caracteres");
        }
    }
    /**
     * Cria um Query a partir de uma string (com sanitização)
     */
    static fromString(value) {
        const sanitized = sanitizeQuery(value);
        return new Query(sanitized);
    }
    /**
     * Cria um Query sem sanitização (use com cuidado)
     */
    static fromStringUnsafe(value) {
        return new Query(value);
    }
    /**
     * Retorna o valor como string
     */
    toString() {
        return this.value;
    }
    /**
     * Retorna o valor (para compatibilidade)
     */
    valueOf() {
        return this.value;
    }
    /**
     * Retorna o comprimento da query
     */
    length() {
        return this.value.length;
    }
    /**
     * Verifica se a query está vazia (após trim)
     */
    isEmpty() {
        return this.value.trim().length === 0;
    }
    /**
     * Compara duas Queries
     */
    equals(other) {
        return this.value === other.value;
    }
    /**
     * Retorna query em minúsculas
     */
    toLowerCase() {
        return this.value.toLowerCase();
    }
    /**
     * Retorna query em maiúsculas
     */
    toUpperCase() {
        return this.value.toUpperCase();
    }
}
//# sourceMappingURL=query.js.map