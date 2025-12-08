/**
 * Repositório de documentos usando arquivos JSON
 * Implementa IDocumentRepository
 */
import type { IDocumentRepository } from "../../domain/interfaces/documentRepository.interface.js";
import type { IStorage } from "./storage.interface.js";
import type { Document } from "./vectorDb.js";
/**
 * Repositório de documentos usando JSON
 */
export declare class JsonDocumentRepository implements IDocumentRepository {
  private storage;
  private basePath;
  constructor(storage: IStorage, basePath: string);
  /**
   * Obtém caminho completo da coleção
   */
  private getCollectionPath;
  /**
   * Garante que o diretório base existe
   */
  private ensureBasePath;
  save(collectionName: string, documents: Document[]): Promise<void>;
  load(collectionName: string): Promise<Document[]>;
  exists(collectionName: string): Promise<boolean>;
  delete(collectionName: string): Promise<void>;
}
//# sourceMappingURL=jsonDocumentRepository.d.ts.map
