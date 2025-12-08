/**
 * Value Object para ID de sessão
 * Garante imutabilidade e validação
 */
/**
 * Value Object para ID de sessão
 */
export declare class SessionId {
  private readonly value;
  private constructor();
  /**
   * Cria um SessionId a partir de uma string UUID
   */
  static fromString(value: string): SessionId;
  /**
   * Gera um SessionId único (UUID v4)
   */
  static generate(): SessionId;
  /**
   * Retorna o valor como string
   */
  toString(): string;
  /**
   * Retorna o valor (para compatibilidade)
   */
  valueOf(): string;
  /**
   * Compara dois SessionIds
   */
  equals(other: SessionId): boolean;
}
//# sourceMappingURL=sessionId.d.ts.map
