/**
 * Repositório de documentos usando arquivos JSON
 * Implementa IDocumentRepository
 */

import { constants } from "fs";
import { access, mkdir, unlink } from "fs/promises";
import { join } from "path";
import type { IDocumentRepository } from "../../domain/interfaces/documentRepository.interface.js";
import { logger } from "../../shared/logging/logger.js";
import type { IStorage } from "./storage.interface.js";
import type { Document } from "./vectorDb.js";

/**
 * Repositório de documentos usando JSON
 */
export class JsonDocumentRepository implements IDocumentRepository {
  constructor(
    private storage: IStorage,
    private basePath: string
  ) {}

  /**
   * Obtém caminho completo da coleção
   */
  private getCollectionPath(collectionName: string): string {
    return join(this.basePath, `${collectionName}.json`);
  }

  /**
   * Garante que o diretório base existe
   */
  private async ensureBasePath(): Promise<void> {
    try {
      await access(this.basePath, constants.F_OK);
    } catch {
      await mkdir(this.basePath, { recursive: true });
      logger.debug({ path: this.basePath }, "Diretório de repositório criado");
    }
  }

  async save(collectionName: string, documents: Document[]): Promise<void> {
    await this.ensureBasePath();
    const path = this.getCollectionPath(collectionName);
    const data = JSON.stringify(documents, null, 2);
    await this.storage.write(path, data);
    logger.debug({ collectionName, documentCount: documents.length }, "Documentos salvos");
  }

  async load(collectionName: string): Promise<Document[]> {
    const path = this.getCollectionPath(collectionName);

    if (!(await this.storage.exists(path))) {
      logger.debug({ collectionName }, "Coleção não existe, retornando vazia");
      return [];
    }

    try {
      const data = await this.storage.read(path);
      const parsed = JSON.parse(data);
      const documents = Array.isArray(parsed) ? parsed : [];

      logger.debug({ collectionName, documentCount: documents.length }, "Documentos carregados");
      return documents;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(
        { collectionName, error: errorMessage },
        "Erro ao carregar coleção, retornando vazia"
      );
      return [];
    }
  }

  async exists(collectionName: string): Promise<boolean> {
    const path = this.getCollectionPath(collectionName);
    return this.storage.exists(path);
  }

  async delete(collectionName: string): Promise<void> {
    const path = this.getCollectionPath(collectionName);
    try {
      await unlink(path);
      logger.debug({ collectionName }, "Coleção deletada");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if ((error as { code?: string }).code !== "ENOENT") {
        logger.warn({ collectionName, error: errorMessage }, "Erro ao deletar coleção");
        throw error;
      }
      // Arquivo não existe, considerar como sucesso
    }
  }
}
