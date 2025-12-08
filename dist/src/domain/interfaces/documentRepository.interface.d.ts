/**
 * Interface para repositório de documentos
 */
import type { Document } from "../../infrastructure/storage/vectorDb.js";
/**
 * Interface para repositório de documentos
 */
export interface IDocumentRepository {
  /**
   * Salva documentos em uma coleção
   */
  save(collectionName: string, documents: Document[]): Promise<void>;
  /**
   * Carrega documentos de uma coleção
   */
  load(collectionName: string): Promise<Document[]>;
  /**
   * Verifica se uma coleção existe
   */
  exists(collectionName: string): Promise<boolean>;
  /**
   * Deleta uma coleção
   */
  delete(collectionName: string): Promise<void>;
}
//# sourceMappingURL=documentRepository.interface.d.ts.map
