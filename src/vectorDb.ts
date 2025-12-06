/**
 * Vector DB simples usando arquivos JSON (sem ChromaDB)
 * Armazena embeddings e documentos em arquivos locais
 */

import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { ChunkMetadata } from "./chunker.js";
import type { FilterValue } from "./types.js";
import { cosineSimilarity } from "./utils.js";

export interface Document {
  id: string;
  text: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

export interface SearchResult {
  id: string;
  text: string;
  metadata: ChunkMetadata;
  distance: number;
  similarity: number;
}

import type { DocumentFilter } from "./types.js";

export interface SearchOptions {
  topK?: number;
  filter?: DocumentFilter;
}

export class VectorDB {
  private collectionName: string;
  private dbPath: string;
  private collectionPath: string;
  private documents: Document[];

  constructor({
    collectionName = "documents",
    path = "./vector_db",
  }: { collectionName?: string; path?: string } = {}) {
    this.collectionName = collectionName;
    this.dbPath = path;
    this.collectionPath = join(this.dbPath, `${collectionName}.json`);
    this.documents = [];
  }

  async initialize(): Promise<void> {
    // Criar diretório se não existir
    if (!existsSync(this.dbPath)) {
      await mkdir(this.dbPath, { recursive: true });
    }

    // Carregar documentos existentes
    if (existsSync(this.collectionPath)) {
      try {
        const data = await readFile(this.collectionPath, "utf-8");
        const parsed = JSON.parse(data);
        this.documents = Array.isArray(parsed) ? parsed : [];
        console.log(
          `📂 Carregados ${this.documents.length} documentos do arquivo ${this.collectionPath}`
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn("Erro ao carregar coleção, iniciando vazia:", errorMessage);
        this.documents = [];
      }
    } else {
      console.log(`📂 Arquivo de coleção não existe: ${this.collectionPath}`);
      this.documents = [];
    }
  }

  async save(): Promise<void> {
    console.log(`💾 Salvando ${this.documents.length} documentos em ${this.collectionPath}`);
    await writeFile(this.collectionPath, JSON.stringify(this.documents, null, 2), "utf-8");
    console.log(`✅ Arquivo salvo com sucesso!`);
  }

  async addDocuments(
    chunks: Array<{ text: string; embedding: number[]; metadata?: ChunkMetadata }>
  ): Promise<void> {
    await this.initialize();

    const newDocs: Document[] = chunks.map((chunk, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      text: chunk.text,
      embedding: chunk.embedding,
      metadata: chunk.metadata || {},
    }));

    console.log(
      `💾 Adicionando ${newDocs.length} documentos à coleção (atualmente: ${this.documents.length})`
    );
    this.documents.push(...newDocs);
    console.log(`💾 Total de documentos após adicionar: ${this.documents.length}`);

    await this.save();

    // Verificar se salvou corretamente
    await this.initialize();
    console.log(`✅ Verificação: ${this.documents.length} documentos na coleção após salvar`);
  }

  async search(
    queryEmbedding: number[],
    { topK = 5, filter = null }: SearchOptions = {}
  ): Promise<SearchResult[]> {
    await this.initialize();

    console.log(`🔍 Buscando em ${this.documents.length} documentos indexados...`);

    if (this.documents.length === 0) {
      console.warn(`⚠️ Vector DB está vazia! Nenhum documento indexado.`);
      return [];
    }

    // Calcular similaridade para cada documento
    const results = this.documents
      .map((doc) => {
        // Aplicar filtro se fornecido
        if (filter) {
          const matches = Object.entries(filter).every(([key, value]) => {
            // Acessar propriedades do metadata de forma type-safe
            const metadataValue = (doc.metadata as Record<string, FilterValue>)[key];
            return metadataValue === value;
          });
          if (!matches) return null;
        }

        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          id: doc.id,
          text: doc.text,
          metadata: doc.metadata,
          distance: 1 - similarity, // Converter similaridade para distância
          similarity: similarity,
        };
      })
      .filter((doc): doc is SearchResult => doc !== null) // Remover documentos que não passaram no filtro
      .sort((a, b) => a.distance - b.distance) // Ordenar por distância (menor = mais similar)
      .slice(0, topK); // Pegar apenas top K

    console.log(`📊 Busca concluída: ${results.length} resultados encontrados`);
    if (results.length > 0) {
      console.log(
        `📄 Melhor match: similaridade ${results[0].similarity.toFixed(4)}, texto: "${results[0].text.substring(0, 100)}..."`
      );
    } else {
      console.warn(`⚠️ Nenhum resultado encontrado! Verificando similaridades...`);
      // Mostrar top 3 similaridades mesmo que baixas
      const allSimilarities = this.documents
        .map((doc) => cosineSimilarity(queryEmbedding, doc.embedding))
        .sort((a, b) => b - a)
        .slice(0, 3);
      console.log(
        `📊 Top 3 similaridades (mesmo baixas): ${allSimilarities.map((s) => s.toFixed(4)).join(", ")}`
      );
    }

    return results;
  }

  async getCollectionInfo(): Promise<{ collectionName: string; documentCount: number }> {
    await this.initialize();
    return {
      collectionName: this.collectionName,
      documentCount: this.documents.length,
    };
  }

  async deleteCollection(): Promise<void> {
    this.documents = [];
    await this.save();
    console.log(`🗑️ Coleção '${this.collectionName}' limpa e salva.`);
  }
}
