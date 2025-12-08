/**
 * Value Object para tamanho de arquivo
 * Garante imutabilidade e validação
 */

import { ValidationError } from "../../shared/errors/errors.js";

/**
 * Value Object para tamanho de arquivo
 */
export class FileSize {
  private constructor(private readonly bytes: number) {
    if (bytes < 0) {
      throw new ValidationError("Tamanho de arquivo não pode ser negativo");
    }
    if (!Number.isFinite(bytes)) {
      throw new ValidationError("Tamanho de arquivo deve ser um número finito");
    }
  }

  /**
   * Tamanho máximo permitido (50 MB)
   */
  static readonly MAX_BYTES = 50 * 1024 * 1024;

  /**
   * Cria um FileSize a partir de bytes
   */
  static fromBytes(bytes: number): FileSize {
    return new FileSize(bytes);
  }

  /**
   * Cria um FileSize a partir de MB
   */
  static fromMB(mb: number): FileSize {
    return new FileSize(mb * 1024 * 1024);
  }

  /**
   * Retorna tamanho em bytes
   */
  toBytes(): number {
    return this.bytes;
  }

  /**
   * Retorna tamanho em KB
   */
  toKB(): number {
    return this.bytes / 1024;
  }

  /**
   * Retorna tamanho em MB
   */
  toMB(): number {
    return this.bytes / 1024 / 1024;
  }

  /**
   * Retorna tamanho em GB
   */
  toGB(): number {
    return this.bytes / 1024 / 1024 / 1024;
  }

  /**
   * Retorna tamanho formatado (ex: "2.5 MB")
   */
  toFormattedString(): string {
    if (this.bytes < 1024) {
      return `${this.bytes} B`;
    }
    if (this.bytes < 1024 * 1024) {
      return `${(this.bytes / 1024).toFixed(2)} KB`;
    }
    if (this.bytes < 1024 * 1024 * 1024) {
      return `${(this.bytes / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${(this.bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  /**
   * Verifica se excede o tamanho máximo
   */
  exceedsMax(): boolean {
    return this.bytes > FileSize.MAX_BYTES;
  }

  /**
   * Compara dois FileSizes
   */
  equals(other: FileSize): boolean {
    return this.bytes === other.bytes;
  }

  /**
   * Verifica se é maior que outro FileSize
   */
  isGreaterThan(other: FileSize): boolean {
    return this.bytes > other.bytes;
  }

  /**
   * Verifica se é menor que outro FileSize
   */
  isLessThan(other: FileSize): boolean {
    return this.bytes < other.bytes;
  }
}
