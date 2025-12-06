/**
 * Aplicação Hono centralizada
 * Contém todas as rotas e lógica do sistema RAG
 * Pode ser usada tanto no servidor Node.js quanto no Azure Functions
 */

import Busboy from "busboy";
import { randomUUID } from "crypto";
import { createWriteStream, readFileSync, statSync } from "fs";
import { unlink, writeFile } from "fs/promises";
import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { tmpdir } from "os";
import { join } from "path";
import { Readable } from "stream";
import type { BusboyFileInfo, FileLike, RequestHeaders } from "./types.js";

// Importar módulos do sistema RAG
import { TextChunker } from "./chunker.js";
import { DocumentProcessor } from "./documentProcessor.js";
import { EmbeddingGenerator } from "./embeddings.js";
import { ResponseGenerator } from "./generator.js";
import { Retriever } from "./retriever.js";
import { VectorDB } from "./vectorDb.js";

// Criar app Hono
const app = new Hono();

// CORS
app.use("/*", cors());

// Inicializar componentes do RAG (lazy initialization)
let documentProcessor: DocumentProcessor | null = null;
let chunker: TextChunker | null = null;
let embeddingGenerator: EmbeddingGenerator | null = null;
let vectorDb: VectorDB | null = null;
let retriever: Retriever | null = null;
let responseGenerator: ResponseGenerator | null = null;

function initializeRAGComponents(): void {
  if (!documentProcessor) {
    documentProcessor = new DocumentProcessor();
    chunker = new TextChunker({ chunkSize: 1000, chunkOverlap: 200 });
    embeddingGenerator = new EmbeddingGenerator({ model: "Xenova/all-MiniLM-L6-v2" });
    vectorDb = new VectorDB({ collectionName: "documents" });
    retriever = new Retriever({ vectorDb, embeddingGenerator });
    responseGenerator = new ResponseGenerator({
      model: "llama3.2",
      ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    });
  }
}

// ==================== ROTAS API ====================

// Health check
app.get("/api/health", (c: Context) => {
  return c.json({ status: "ok", message: "RAG System running" });
});

// Upload e processar documento
app.post("/api/documents/upload", async (c: Context) => {
  try {
    initializeRAGComponents();
    if (!documentProcessor || !chunker || !embeddingGenerator || !vectorDb) {
      throw new Error("Componentes RAG não inicializados");
    }

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return c.json({ error: "Nenhum arquivo enviado" }, 400);
    }

    // Salvar arquivo temporário
    const tempPath = join(tmpdir(), `${randomUUID()}-${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempPath, buffer);

    // Processar documento
    const { text, metadata } = await documentProcessor.process(tempPath);

    // Criar chunks
    const chunks = chunker.createChunks(text, metadata);

    // Gerar embeddings
    const chunksWithEmbeddings = await embeddingGenerator.generateEmbeddings(chunks);

    // Indexar na Vector DB
    await vectorDb.addDocuments(chunksWithEmbeddings);

    // Limpar arquivo temporário
    await unlink(tempPath);

    return c.json({
      success: true,
      filename: file.name,
      chunksCreated: chunks.length,
      metadata,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao processar documento:", error);
    return c.json({ error: errorMessage }, 500);
  }
});

// Upload + Query em uma única chamada
app.post("/api/query", async (c: Context) => {
  try {
    initializeRAGComponents();
    if (
      !documentProcessor ||
      !chunker ||
      !embeddingGenerator ||
      !vectorDb ||
      !retriever ||
      !responseGenerator
    ) {
      throw new Error("Componentes RAG não inicializados");
    }

    // Verificar se é multipart/form-data ou JSON
    const contentType = c.req.header("content-type") || "";

    let file: File | FileLike | null = null;
    let query: string | null = null;

    // Tentar detectar o tipo de conteúdo
    const isMultipart = contentType.includes("multipart/form-data");
    const isFormUrlEncoded = contentType.includes("application/x-www-form-urlencoded");
    const isJson = contentType.includes("application/json");

    if (isMultipart || isFormUrlEncoded) {
      // Processar form-data usando Busboy (mais confiável que o método nativo)
      try {
        const rawRequest = c.req.raw;

        // Busboy precisa dos headers em formato objeto simples (não Headers object)
        const headers: Record<string, string> = {};
        const requestHeaders = rawRequest.headers as RequestHeaders | Headers;

        if (requestHeaders && typeof (requestHeaders as Headers).forEach === "function") {
          // Se for Headers object (Web API)
          (requestHeaders as Headers).forEach((value: string, key: string) => {
            headers[key.toLowerCase()] = value;
          });
        } else if (requestHeaders) {
          // Se já for objeto simples
          Object.entries(requestHeaders).forEach(([key, value]) => {
            if (typeof value === "string") {
              headers[key.toLowerCase()] = value;
            } else if (Array.isArray(value) && value.length > 0) {
              headers[key.toLowerCase()] = value[0];
            }
          });
        }

        if (!headers["content-type"]) {
          return c.json(
            {
              error: "Erro ao processar form-data: Missing Content-Type",
              hint: "Certifique-se de usar Content-Type: multipart/form-data. No Postman, use form-data (não raw). No curl, use -F (não --data).",
            },
            400
          );
        }

        // Criar stream a partir do body
        const bodyStream = rawRequest.body;
        if (!bodyStream) {
          return c.json({ error: "Body vazio" }, 400);
        }

        // Converter ReadableStream para Node.js Readable
        const nodeStream =
          bodyStream instanceof Readable
            ? bodyStream
            : Readable.fromWeb(bodyStream as ReadableStream);

        const busboy = Busboy({ headers });

        await new Promise<void>((resolve, reject) => {
          busboy.on("file", (name: string, fileStream: Readable, info: BusboyFileInfo) => {
            if (name === "file") {
              const filename = info.filename || "unknown";
              const mimeType = info.mimeType || "application/octet-stream";
              const tempFilePath = join(tmpdir(), `${randomUUID()}-${filename}`);

              const writeStream = createWriteStream(tempFilePath);
              fileStream.pipe(writeStream);

              writeStream.on("finish", () => {
                const stats = statSync(tempFilePath);
                file = {
                  name: filename,
                  size: stats.size,
                  type: mimeType,
                  tempPath: tempFilePath,
                  arrayBuffer: async () => {
                    const data = readFileSync(tempFilePath);
                    return data.buffer;
                  },
                };
              });

              writeStream.on("error", reject);
            }
          });

          busboy.on("field", (name: string, value: string) => {
            if (name === "query") {
              query = value;
            }
          });

          busboy.on("finish", resolve);
          busboy.on("error", reject);

          nodeStream.pipe(busboy);
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return c.json(
          {
            error: `Erro ao processar form-data: ${errorMessage}`,
            hint: "Certifique-se de usar Content-Type: multipart/form-data. No Postman, use form-data (não raw). No curl, use -F (não --data).",
          },
          400
        );
      }
    } else if (isJson) {
      // Processar JSON
      const body = (await c.req.json()) as { query?: string; file?: unknown };
      query = body.query || null;
    } else {
      return c.json(
        { error: "Content-Type não suportado. Use multipart/form-data ou application/json" },
        400
      );
    }

    // Processar arquivo se fornecido
    if (file !== null && file !== undefined) {
      const fileInstance = file;
      // Verificar se é File ou FileLike usando type guards
      let fileLike: FileLike;

      // Verificar se é File (Web API)
      if (typeof File !== "undefined") {
        const fileAsAny = fileInstance as unknown;
        if (fileAsAny instanceof File) {
          const webFile = fileAsAny as File;
          fileLike = {
            name: webFile.name,
            size: webFile.size,
            type: webFile.type,
            arrayBuffer: () => webFile.arrayBuffer(),
          };
        } else {
          // É FileLike
          fileLike = fileInstance as FileLike;
        }
      } else {
        // File não está disponível, assumir FileLike
        fileLike = fileInstance as FileLike;
      }

      // Validar que tem os dados necessários
      if (fileLike.size > 0 && (fileLike.tempPath || fileLike.name)) {
        console.log(`📄 Processando arquivo: ${fileLike.name || "desconhecido"}`);

        // Usar caminho temporário se já existir (do Busboy), senão criar
        let tempPath: string = fileLike.tempPath || "";

        if (!tempPath) {
          // Salvar arquivo temporário (método tradicional - quando não usa Busboy)
          tempPath = join(tmpdir(), `${randomUUID()}-${fileLike.name || "file"}`);
          const arrayBuffer = await fileLike.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await writeFile(tempPath, buffer);
        }

        try {
          // Limpar vector_db antes de processar novo documento
          if (vectorDb) {
            await vectorDb.deleteCollection();
            await vectorDb.initialize();
          }

          // Processar documento
          const { text, metadata } = await documentProcessor.process(tempPath);

          // Criar chunks
          const chunks = chunker.createChunks(text, metadata);

          // Gerar embeddings
          const chunksWithEmbeddings = await embeddingGenerator.generateEmbeddings(chunks);

          // Indexar na Vector DB
          await vectorDb.addDocuments(chunksWithEmbeddings);

          console.log(`✅ Documento processado: ${chunks.length} chunks criados`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Erro ao processar documento:", errorMessage);
          // Continuar mesmo se houver erro no processamento do arquivo
        } finally {
          // Limpar arquivo temporário
          if (fileLike.tempPath && fileLike.tempPath !== tempPath) {
            try {
              await unlink(fileLike.tempPath);
            } catch {
              // Ignorar erros ao deletar
            }
          }
          if (tempPath) {
            try {
              await unlink(tempPath);
            } catch {
              // Ignorar erros ao deletar
            }
          }
        }
      }
    }

    // Validar query
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return c.json({ error: "Query é obrigatória" }, 400);
    }

    // Buscar documentos relevantes
    const retrievedDocs = await retriever.retrieve(query, { topK: 10 });

    if (retrievedDocs.length === 0) {
      return c.json({
        success: true,
        response:
          "Não encontrei informações relevantes no contexto fornecido para responder sua pergunta.",
        sources: [],
        metadata: {
          model: "llama3.2",
          numSources: 0,
        },
        fileProcessed: file
          ? typeof File !== "undefined" && (file as unknown) instanceof File
            ? (file as File).name
            : (file as FileLike).name || null
          : null,
      });
    }

    // Gerar resposta
    const result = await responseGenerator.generate(query, retrievedDocs);

    return c.json({
      success: true,
      response: result.response,
      sources: result.sources,
      metadata: {
        model: "llama3.2",
        numSources: result.sources.length,
      },
      fileProcessed: file
        ? typeof File !== "undefined" && (file as unknown) instanceof File
          ? (file as File).name
          : (file as FileLike).name || null
        : null,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro na query:", error);
    return c.json({ error: errorMessage }, 500);
  }
});

// Informações da coleção
app.get("/api/collection/info", async (c: Context) => {
  try {
    initializeRAGComponents();
    if (!vectorDb) {
      throw new Error("VectorDB não inicializado");
    }
    const info = await vectorDb.getCollectionInfo();
    return c.json(info);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: errorMessage }, 500);
  }
});

// Limpar coleção
app.delete("/api/collection", async (c: Context) => {
  try {
    initializeRAGComponents();
    if (!vectorDb) {
      throw new Error("VectorDB não inicializado");
    }
    await vectorDb.deleteCollection();
    return c.json({ success: true, message: "Coleção limpa" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: errorMessage }, 500);
  }
});

// Exportar app Hono
export default app;
