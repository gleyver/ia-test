/**
 * Use Case: Processar e indexar documento
 * Encapsula lógica de negócio para processamento de documentos
 */

import type { VectorDB } from "../../infrastructure/storage/vectorDb.js";
import type { FileLike } from "../../shared/types/types.js";
import type { IDocumentProcessor } from "../interfaces/documentProcessor.interface.js";
import type { IEmbeddingGenerator } from "../interfaces/embeddingGenerator.interface.js";
import type { ITextChunker } from "../interfaces/textChunker.interface.js";
import { SessionId } from "../valueObjects/sessionId.js";

export interface ProcessDocumentCommand {
  file: FileLike;
  sessionId?: SessionId;
}

export interface ProcessDocumentResult {
  sessionId: SessionId;
  chunksCreated: number;
  metadata: unknown;
}

/**
 * Use Case para processar e indexar documento
 */
export class ProcessDocumentUseCase {
  constructor(
    private documentProcessor: IDocumentProcessor,
    private chunker: ITextChunker,
    private embeddingGenerator: IEmbeddingGenerator,
    private createVectorDb: (sessionId: string) => VectorDB
  ) {}

  async execute(command: ProcessDocumentCommand): Promise<ProcessDocumentResult> {
    const sessionId = command.sessionId || SessionId.generate();

    // Processar documento (precisa do caminho do arquivo)
    const filePath = (command.file as { tempPath?: string }).tempPath || command.file.name || "";
    const { text, metadata } = await this.documentProcessor.process(filePath);

    // Criar chunks
    const chunks = this.chunker.createChunks(text, metadata);

    // Gerar embeddings
    const chunksWithEmbeddings = await this.embeddingGenerator.generateEmbeddings(chunks);

    // Indexar na Vector DB
    const vectorDb = this.createVectorDb(sessionId.toString());
    await vectorDb.initialize();
    await vectorDb.addDocuments(chunksWithEmbeddings);

    return {
      sessionId,
      chunksCreated: chunks.length,
      metadata,
    };
  }
}
