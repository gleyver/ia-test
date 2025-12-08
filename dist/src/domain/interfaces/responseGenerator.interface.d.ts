/**
 * Interface para geradores de resposta
 */
import type { GenerateResult } from "../../infrastructure/llm/generator.js";
import type { SearchResult } from "../../infrastructure/storage/vectorDb.js";
/**
 * Interface para geradores de resposta
 */
export interface IResponseGenerator {
  /**
   * Gera resposta com contexto de documentos
   */
  generate(query: string, retrievedDocs: SearchResult[]): Promise<GenerateResult>;
  /**
   * Gera resposta sem contexto (apenas conhecimento do modelo)
   */
  generateWithoutContext(query: string): Promise<GenerateResult>;
}
//# sourceMappingURL=responseGenerator.interface.d.ts.map
