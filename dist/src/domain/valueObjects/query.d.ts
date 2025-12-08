/**
 * Value Object para query de busca
 * Garante imutabilidade, validação e sanitização
 */
/**
 * Value Object para query de busca
 */
export declare class Query {
  private readonly value;
  private constructor();
  /**
   * Cria um Query a partir de uma string (com sanitização)
   */
  static fromString(value: string): Query;
  /**
   * Cria um Query sem sanitização (use com cuidado)
   */
  static fromStringUnsafe(value: string): Query;
  /**
   * Retorna o valor como string
   */
  toString(): string;
  /**
   * Retorna o valor (para compatibilidade)
   */
  valueOf(): string;
  /**
   * Retorna o comprimento da query
   */
  length(): number;
  /**
   * Verifica se a query está vazia (após trim)
   */
  isEmpty(): boolean;
  /**
   * Compara duas Queries
   */
  equals(other: Query): boolean;
  /**
   * Retorna query em minúsculas
   */
  toLowerCase(): string;
  /**
   * Retorna query em maiúsculas
   */
  toUpperCase(): string;
}
//# sourceMappingURL=query.d.ts.map
