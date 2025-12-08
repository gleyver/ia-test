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
export declare class ProcessDocumentUseCase {
  private documentProcessor;
  private chunker;
  private embeddingGenerator;
  private createVectorDb;
  constructor(
    documentProcessor: IDocumentProcessor,
    chunker: ITextChunker,
    embeddingGenerator: IEmbeddingGenerator,
    createVectorDb: (sessionId: string) => VectorDB
  );
  execute(command: ProcessDocumentCommand): Promise<ProcessDocumentResult>;
}
//# sourceMappingURL=processDocumentUseCase.d.ts.map
