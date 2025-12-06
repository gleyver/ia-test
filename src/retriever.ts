/**
 * Retriever para busca de documentos
 */

import type { EmbeddingGenerator } from "./embeddings.js";
import type { DocumentFilter } from "./types.js";
import type { SearchResult, VectorDB } from "./vectorDb.js";

export interface RetrieveOptions {
  topK?: number;
  filter?: DocumentFilter;
}

export class Retriever {
  private vectorDb: VectorDB;
  private embeddingGenerator: EmbeddingGenerator;

  constructor({
    vectorDb,
    embeddingGenerator,
  }: {
    vectorDb: VectorDB;
    embeddingGenerator: EmbeddingGenerator;
  }) {
    this.vectorDb = vectorDb;
    this.embeddingGenerator = embeddingGenerator;
  }

  async retrieve(
    query: string,
    { topK = 10, filter = null }: RetrieveOptions = {}
  ): Promise<SearchResult[]> {
    // Gerar embedding da query
    console.log(`🔢 Gerando embedding da query: "${query}"`);
    const queryEmbedding = await this.embeddingGenerator.generateEmbedding(query);
    console.log(`✅ Embedding gerado: ${queryEmbedding.length} dimensões`);

    // Buscar na Vector DB (aumentar topK para pegar mais contexto)
    const results = await this.vectorDb.search(queryEmbedding, { topK, filter });

    if (results.length > 0) {
      console.log(
        `📊 Similaridades encontradas: ${results.map((r) => r.similarity.toFixed(3)).join(", ")}`
      );
      console.log(`📄 Primeiros 3 resultados:`);
      results.slice(0, 3).forEach((r, i) => {
        console.log(
          `  ${i + 1}. Similaridade: ${r.similarity.toFixed(3)} | Texto: ${r.text.substring(0, 150)}...`
        );
      });
    } else {
      console.warn(`⚠️ Nenhum resultado encontrado na busca!`);
    }

    return results;
  }
}
