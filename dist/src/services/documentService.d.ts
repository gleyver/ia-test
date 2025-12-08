/**
 * Serviço de processamento de documentos
 * Isola lógica de negócio das rotas
 */
import "reflect-metadata";
import type { IDocumentProcessor } from "../domain/interfaces/documentProcessor.interface.js";
import type { IEmbeddingGenerator } from "../domain/interfaces/embeddingGenerator.interface.js";
import type { ITextChunker } from "../domain/interfaces/textChunker.interface.js";
import type { VectorDB } from "../infrastructure/storage/vectorDb.js";
import type { FileLike } from "../shared/types/types.js";
export interface ProcessResult {
  sessionId: string;
  filename: string;
  chunksCreated: number;
  metadata: unknown;
}
export declare class DocumentService {
  private processDocumentUseCase;
  constructor(
    documentProcessor: IDocumentProcessor,
    chunker: ITextChunker,
    embeddingGenerator: IEmbeddingGenerator,
    createVectorDb: (sessionId: string) => VectorDB
  );
  processAndIndex(file: FileLike, sessionId?: string): Promise<ProcessResult>;
}
//# sourceMappingURL=documentService.d.ts.map
