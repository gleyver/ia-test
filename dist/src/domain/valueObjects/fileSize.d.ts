/**
 * Value Object para tamanho de arquivo
 * Garante imutabilidade e validação
 */
/**
 * Value Object para tamanho de arquivo
 */
export declare class FileSize {
  private readonly bytes;
  private constructor();
  /**
   * Tamanho máximo permitido (50 MB)
   */
  static readonly MAX_BYTES: number;
  /**
   * Cria um FileSize a partir de bytes
   */
  static fromBytes(bytes: number): FileSize;
  /**
   * Cria um FileSize a partir de MB
   */
  static fromMB(mb: number): FileSize;
  /**
   * Retorna tamanho em bytes
   */
  toBytes(): number;
  /**
   * Retorna tamanho em KB
   */
  toKB(): number;
  /**
   * Retorna tamanho em MB
   */
  toMB(): number;
  /**
   * Retorna tamanho em GB
   */
  toGB(): number;
  /**
   * Retorna tamanho formatado (ex: "2.5 MB")
   */
  toFormattedString(): string;
  /**
   * Verifica se excede o tamanho máximo
   */
  exceedsMax(): boolean;
  /**
   * Compara dois FileSizes
   */
  equals(other: FileSize): boolean;
  /**
   * Verifica se é maior que outro FileSize
   */
  isGreaterThan(other: FileSize): boolean;
  /**
   * Verifica se é menor que outro FileSize
   */
  isLessThan(other: FileSize): boolean;
}
//# sourceMappingURL=fileSize.d.ts.map
