/**
 * Adapter para converter diferentes tipos de File para FileLike
 * Implementa Adapter Pattern
 */

import type { FileLike } from "../../shared/types/types.js";

/**
 * Adapter para converter File (Web API) ou FileLike para FileLike
 */
export class FileAdapter {
  /**
   * Converte File ou FileLike para FileLike
   */
  toFileLike(file: File | FileLike): FileLike {
    if (this.isWebFile(file)) {
      return this.convertWebFile(file);
    }
    return file as FileLike;
  }

  /**
   * Verifica se é File (Web API)
   */
  private isWebFile(file: unknown): file is File {
    return typeof File !== "undefined" && file instanceof File;
  }

  /**
   * Converte File (Web API) para FileLike
   */
  private convertWebFile(file: File): FileLike {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      arrayBuffer: () => file.arrayBuffer(),
    };
  }
}
