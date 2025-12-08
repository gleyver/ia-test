/**
 * Value Object para ID de documento
 * Garante imutabilidade e validação
 */
/**
 * Value Object para ID de documento
 */
export declare class DocumentId {
  private readonly value;
  private constructor();
  /**
   * Cria um DocumentId a partir de uma string
   */
  static fromString(value: string): DocumentId;
  /**
   * Gera um DocumentId único
   */
  static generate(): DocumentId;
  /**
   * Retorna o valor como string
   */
  toString(): string;
  /**
   * Retorna o valor (para compatibilidade)
   */
  valueOf(): string;
  /**
   * Compara dois DocumentIds
   */
  equals(other: DocumentId): boolean;
}
//# sourceMappingURL=documentId.d.ts.map
