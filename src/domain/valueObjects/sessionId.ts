/**
 * Value Object para ID de sessão
 * Garante imutabilidade e validação
 */

import { randomUUID } from "crypto";
import { ValidationError } from "../../shared/errors/errors.js";

/**
 * Value Object para ID de sessão
 */
export class SessionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new ValidationError("SessionId não pode ser vazio");
    }
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError("SessionId deve ser um UUID válido");
    }
  }

  /**
   * Cria um SessionId a partir de uma string UUID
   */
  static fromString(value: string): SessionId {
    return new SessionId(value);
  }

  /**
   * Gera um SessionId único (UUID v4)
   */
  static generate(): SessionId {
    return new SessionId(randomUUID());
  }

  /**
   * Retorna o valor como string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Retorna o valor (para compatibilidade)
   */
  valueOf(): string {
    return this.value;
  }

  /**
   * Compara dois SessionIds
   */
  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
