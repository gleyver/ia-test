/**
 * Value Object para ID de documento
 * Garante imutabilidade e validação
 */
import { ValidationError } from "../../shared/errors/errors.js";
/**
 * Value Object para ID de documento
 */
export class DocumentId {
    value;
    constructor(value) {
        this.value = value;
        if (!value || value.trim().length === 0) {
            throw new ValidationError("DocumentId não pode ser vazio");
        }
        if (value.length > 255) {
            throw new ValidationError("DocumentId não pode ter mais de 255 caracteres");
        }
    }
    /**
     * Cria um DocumentId a partir de uma string
     */
    static fromString(value) {
        return new DocumentId(value);
    }
    /**
     * Gera um DocumentId único
     */
    static generate() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return new DocumentId(`${timestamp}-${random}`);
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
     * Compara dois DocumentIds
     */
    equals(other) {
        return this.value === other.value;
    }
}
//# sourceMappingURL=documentId.js.map