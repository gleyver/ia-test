/**
 * Adapter para converter diferentes tipos de File para FileLike
 * Implementa Adapter Pattern
 */
import type { FileLike } from "../../shared/types/types.js";
/**
 * Adapter para converter File (Web API) ou FileLike para FileLike
 */
export declare class FileAdapter {
  /**
   * Converte File ou FileLike para FileLike
   */
  toFileLike(file: File | FileLike): FileLike;
  /**
   * Verifica se é File (Web API)
   */
  private isWebFile;
  /**
   * Converte File (Web API) para FileLike
   */
  private convertWebFile;
}
//# sourceMappingURL=fileAdapter.d.ts.map
