/**
 * Gerador de respostas usando Ollama
 */
import type { SearchResult } from "./vectorDb.js";
export interface GenerateResult {
  response: string;
  sources: string[];
  metadata: {
    model: string;
    numSources: number;
  };
}
export declare class ResponseGenerator {
  private model;
  private ollamaUrl;
  constructor({ model, ollamaUrl }?: { model?: string; ollamaUrl?: string });
  buildContext(retrievedDocs: SearchResult[]): string;
  buildPrompt(query: string, context: string, systemMessage?: string | null): string;
  generate(
    query: string,
    retrievedDocs: SearchResult[],
    systemMessage?: string | null
  ): Promise<GenerateResult>;
}
//# sourceMappingURL=generator.d.ts.map
