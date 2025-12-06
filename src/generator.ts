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

export class ResponseGenerator {
  private model: string;
  private ollamaUrl: string;

  constructor({
    model = "llama3.2",
    ollamaUrl = "http://localhost:11434",
  }: { model?: string; ollamaUrl?: string } = {}) {
    this.model = model;
    this.ollamaUrl = ollamaUrl;
  }

  buildContext(retrievedDocs: SearchResult[]): string {
    if (!retrievedDocs || retrievedDocs.length === 0) {
      return "Nenhum contexto relevante encontrado.";
    }

    return retrievedDocs
      .map((doc, i) => {
        const source = doc.metadata?.source || "Desconhecido";
        return `[Documento ${i + 1} - Fonte: ${source}]\n${doc.text}\n`;
      })
      .join("\n---\n\n");
  }

  buildPrompt(query: string, context: string, systemMessage: string | null = null): string {
    if (!systemMessage) {
      systemMessage = `Você é um assistente especializado em responder perguntas baseadas em documentos fornecidos.

INSTRUÇÕES IMPORTANTES:
- Leia TODO o contexto fornecido com atenção
- Procure por informações relacionadas à pergunta em TODOS os documentos do contexto
- Se encontrar a informação, responda de forma clara e precisa
- Se a informação estiver parcialmente no contexto, use o que encontrar e mencione isso
- Números, valores, datas e nomes são informações importantes - procure por eles cuidadosamente
- Se realmente não encontrar a informação no contexto, diga claramente que não tem essa informação
- Cite a fonte quando possível
- Seja preciso, objetivo e completo`;
    }

    return `${systemMessage}

CONTEXTO COMPLETO (leia tudo com atenção):
${context}

PERGUNTA DO USUÁRIO: ${query}

IMPORTANTE: Leia todo o contexto acima cuidadosamente. Procure por informações relacionadas à pergunta em TODOS os documentos. Se encontrar a informação, responda de forma clara. Se não encontrar, diga que não tem essa informação no contexto fornecido.

RESPOSTA:`;
  }

  async generate(
    query: string,
    retrievedDocs: SearchResult[],
    systemMessage: string | null = null
  ): Promise<GenerateResult> {
    const context = this.buildContext(retrievedDocs);
    const prompt = this.buildPrompt(query, context, systemMessage);

    // Chamar Ollama API
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar resposta: ${response.statusText}`);
    }

    const result = (await response.json()) as { response?: string };
    const answer = result.response || "";

    // Extrair fontes
    const sources = [
      ...new Set(retrievedDocs.map((doc) => doc.metadata?.source || "Desconhecido")),
    ];

    return {
      response: answer,
      sources,
      metadata: {
        model: this.model,
        numSources: retrievedDocs.length,
      },
    };
  }
}
