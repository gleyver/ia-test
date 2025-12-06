/**
 * Processador de documentos para Node.js
 * Suporta OCR para PDFs escaneados (gratuito e local)
 */

import { createCanvas, Image } from "canvas";
import { readFile } from "fs/promises";
import mammoth from "mammoth";
import { extname } from "path";
import { PDFParse } from "pdf-parse";
import { fromPath } from "pdf2pic";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker, Worker } from "tesseract.js";
import type { ChunkMetadata } from "./chunker.js";
import type { PDF2PicResult, PDFInfo, PDFMetadata } from "./types.js";

export interface ProcessResult {
  text: string;
  metadata: ChunkMetadata;
}

export class DocumentProcessor {
  private ocrWorker: Worker | null;

  constructor() {
    this.ocrWorker = null;
  }

  async getOCRWorker(): Promise<Worker> {
    if (!this.ocrWorker) {
      console.log("🔄 Inicializando OCR (Tesseract.js)...");
      this.ocrWorker = await createWorker("por+eng"); // Português e Inglês
      console.log("✅ OCR inicializado!");
    }
    return this.ocrWorker;
  }

  async extractTextWithOCR(pdfBuffer: Buffer): Promise<string> {
    console.log("🔍 PDF parece ser escaneado, usando OCR (Tesseract.js)...");
    const worker = await this.getOCRWorker();

    try {
      // Tesseract.js não processa PDFs diretamente, precisa converter para imagem
      console.log("📄 Convertendo PDF para imagens e processando com OCR...");
      console.log("⏳ Por favor, aguarde (isso pode demorar para arquivos grandes)...");

      // Obter número de páginas primeiro (nova API do pdf-parse v2)
      const parser = new PDFParse({ data: pdfBuffer });
      const info = await parser.getInfo();
      const numPages = info.total || 1;

      console.log(`📖 PDF tem ${numPages} páginas. Processando cada página...`);

      // Tentar usar pdf2pic primeiro (mais rápido se GraphicsMagick estiver instalado)
      let usePdf2Pic = false;
      const { writeFile, unlink } = await import("fs/promises");
      const { join } = await import("path");
      const { tmpdir } = await import("os");
      const { randomUUID } = await import("crypto");

      const tempPdfPath = join(tmpdir(), `${randomUUID()}.pdf`);
      await writeFile(tempPdfPath, pdfBuffer);

      try {
        // Tentar usar pdf2pic
        const options = {
          density: 200,
          saveFilename: "page",
          savePath: tmpdir(),
          format: "png" as const,
          width: 2000,
          height: 2000,
        };

        const convert = fromPath(tempPdfPath, options);
        const testResult = await convert(1, { responseType: "buffer" as const });

        const result = testResult as PDF2PicResult;
        if (result && result.buffer && result.buffer.length > 0) {
          usePdf2Pic = true;
          console.log("✅ Usando pdf2pic para conversão (GraphicsMagick detectado)");
        }
      } catch (pdf2picError: unknown) {
        const errorMessage =
          pdf2picError instanceof Error ? pdf2picError.message : String(pdf2picError);
        console.log(
          `⚠️ pdf2pic não disponível (${errorMessage}), usando pdfjs-dist + canvas como fallback`
        );
        usePdf2Pic = false;
      }

      const allTexts: string[] = [];

      if (usePdf2Pic) {
        // Método 1: pdf2pic (mais rápido)
        const convert = fromPath(tempPdfPath, {
          density: 200,
          saveFilename: "page",
          savePath: tmpdir(),
          format: "png" as const,
          width: 2000,
          height: 2000,
        });

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          console.log(`  📄 Processando página ${pageNum}/${numPages} (pdf2pic)...`);

          try {
            const result = (await convert(pageNum, {
              responseType: "buffer" as const,
            })) as PDF2PicResult;

            if (result && result.buffer && result.buffer.length > 0) {
              const {
                data: { text },
              } = await worker.recognize(result.buffer);

              if (text && text.trim().length > 0) {
                allTexts.push(`=== Página ${pageNum} ===\n${text.trim()}`);
                console.log(`  ✅ Página ${pageNum}: ${text.length} caracteres extraídos`);
              }
            }
          } catch (pageError: unknown) {
            const errorMessage = pageError instanceof Error ? pageError.message : String(pageError);
            console.warn(`  ⚠️ Erro ao processar página ${pageNum}: ${errorMessage}`);
            continue;
          }
        }
      } else {
        // Método 2: pdfjs-dist + canvas (fallback, não precisa de dependências externas)
        console.log("🔄 Usando pdfjs-dist + canvas para renderização...");

        // Configurar Image global para pdfjs
        if (typeof global !== "undefined") {
          (global as typeof globalThis & { Image: typeof Image }).Image = Image;
        }

        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          verbosity: 0,
          // Desabilitar algumas funcionalidades que podem causar problemas
          disableAutoFetch: false,
          disableStream: false,
        });

        const pdf = await loadingTask.promise;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          console.log(`  📄 Processando página ${pageNum}/${numPages} (pdfjs-dist)...`);

          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext("2d");

            // Renderizar página (pode falhar se tiver imagens inline problemáticas)
            try {
              // Usar type assertion para contornar incompatibilidade de tipos do pdfjs-dist
              await page.render({
                canvasContext: context as unknown as Record<string, unknown>,
                viewport: viewport,
              } as unknown as Parameters<typeof page.render>[0]).promise;
            } catch (renderError: unknown) {
              // Se falhar na renderização completa, tentar apenas texto
              const errorMessage =
                renderError instanceof Error ? renderError.message : String(renderError);
              console.warn(
                `  ⚠️ Erro na renderização completa (${errorMessage}), tentando extrair apenas texto...`
              );
              const textContent = await page.getTextContent();
              const textItems = textContent.items
                .map((item) => {
                  // Verificar se é TextItem (tem propriedade str)
                  if ("str" in item && typeof (item as { str?: string }).str === "string") {
                    return (item as { str: string }).str;
                  }
                  return "";
                })
                .filter((str) => str.length > 0)
                .join(" ");

              if (textItems && textItems.trim().length > 0) {
                allTexts.push(`=== Página ${pageNum} ===\n${textItems.trim()}`);
                console.log(
                  `  ✅ Página ${pageNum}: ${textItems.length} caracteres extraídos (apenas texto)`
                );
                continue;
              }
              throw renderError;
            }

            const imageBuffer = canvas.toBuffer("image/png");
            const {
              data: { text },
            } = await worker.recognize(imageBuffer);

            if (text && text.trim().length > 0) {
              allTexts.push(`=== Página ${pageNum} ===\n${text.trim()}`);
              console.log(`  ✅ Página ${pageNum}: ${text.length} caracteres extraídos`);
            }
          } catch (pageError: unknown) {
            const errorMessage = pageError instanceof Error ? pageError.message : String(pageError);
            console.warn(`  ⚠️ Erro ao processar página ${pageNum}: ${errorMessage}`);
            continue;
          }
        }
      }

      // Limpar arquivo temporário
      try {
        await unlink(tempPdfPath);
      } catch {
        // Ignorar erro ao deletar
      }

      const combinedText = allTexts.join("\n\n");

      if (combinedText && combinedText.trim().length > 0) {
        console.log(`✅ OCR extraiu ${combinedText.length} caracteres de ${numPages} páginas`);
        return combinedText.trim();
      } else {
        console.warn(`⚠️ OCR não extraiu texto de nenhuma página`);
        return "";
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.warn(`⚠️ Erro no OCR: ${errorMessage}`);
      if (errorStack) {
        console.error(`❌ Stack:`, errorStack);
      }
      return "";
    }
  }

  async process(filePath: string): Promise<ProcessResult> {
    const ext = extname(filePath).toLowerCase();
    const buffer = await readFile(filePath);

    let text = "";
    const metadata: ChunkMetadata = {
      source: filePath,
      filename: filePath.split("/").pop(),
      extension: ext,
    };

    switch (ext) {
      case ".pdf":
        console.log(`📄 Processando PDF (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);
        // Nova API do pdf-parse v2
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        const info = await parser.getInfo();

        // Texto principal (getText retorna TextResult com pages e text)
        text = textResult.text || "";
        const initialTextLength = text.length;

        metadata.pages = info.total;
        // Converter info.info para PDFInfo (pode conter strings, numbers, booleans)
        if (info.info && typeof info.info === "object") {
          const infoObj: Record<string, string | number | boolean | undefined> = {};
          Object.entries(info.info).forEach(([key, value]) => {
            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              infoObj[key] = value;
            }
          });
          metadata.info = infoObj as PDFInfo;
        }
        // Converter metadata para PDFMetadata
        if (info.metadata && typeof info.metadata === "object") {
          const metaObj: Record<string, string | number | boolean | PDFInfo | undefined> = {};
          const metadataObj = info.metadata as unknown as Record<string, unknown>;
          Object.entries(metadataObj).forEach(([key, value]) => {
            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean" ||
              (value && typeof value === "object")
            ) {
              metaObj[key] = value as string | number | boolean | PDFInfo | undefined;
            }
          });
          metadata.metadata = metaObj as PDFMetadata;
        }

        console.log(`📄 Extração inicial: ${text.length} caracteres de ${info.total} páginas`);

        // Tentar extrair mais texto usando getTextContent se disponível
        try {
          // Se o texto inicial for muito curto, tentar OCR mesmo para PDFs com texto
          // Isso ajuda a capturar texto em imagens ou formatações complexas
          const shouldUseOCR = text.length < 1000 || (text.length < 200 && info.total > 0);

          if (shouldUseOCR) {
            console.log(`⚠️ PDF extraiu ${text.length} chars de ${info.total} páginas.`);
            console.log(`⚠️ Usando OCR para garantir extração completa...`);

            // Tentar OCR
            const ocrText = await this.extractTextWithOCR(buffer);

            if (ocrText && ocrText.length > 0) {
              // Combinar texto original com OCR (OCR pode ter mais detalhes)
              if (ocrText.length > text.length * 1.2) {
                // OCR extraiu significativamente mais - usar OCR como principal
                console.log(
                  `✅ OCR extraiu ${ocrText.length} caracteres (vs ${text.length} do método normal)`
                );
                text = ocrText;
                metadata.usedOCR = true;
              } else {
                // Combinar ambos para ter mais contexto
                console.log(
                  `✅ Combinando texto original (${text.length} chars) com OCR (${ocrText.length} chars)`
                );
                text = text + "\n\n=== Texto adicional do OCR ===\n" + ocrText;
                metadata.usedOCR = true;
              }
            } else {
              console.warn(`⚠️ OCR não retornou texto. Mantendo texto original.`);
              metadata.usedOCR = false;
            }
          } else {
            metadata.usedOCR = false;
          }

          // Sempre adicionar metadados se disponíveis (podem conter informações importantes)
          if (info.info) {
            const infoParts: string[] = [];
            Object.entries(info.info).forEach(([key, value]) => {
              if (value && typeof value === "string" && value.length > 0) {
                infoParts.push(`${key}: ${value}`);
              }
            });
            if (infoParts.length > 0) {
              text += "\n\n=== Metadados do PDF ===\n" + infoParts.join("\n");
            }
          }
        } catch (ocrError: unknown) {
          const errorMessage = ocrError instanceof Error ? ocrError.message : String(ocrError);
          console.warn(`⚠️ Erro ao tentar OCR: ${errorMessage}`);
          metadata.usedOCR = false;
        }

        // Log detalhado
        console.log(`📄 PDF processado: ${text.length} caracteres de ${info.total} páginas`);
        console.log(`📊 Informações:`, {
          numpages: info.total,
          textLength: text.length,
          usedOCR: metadata.usedOCR || false,
          improvement:
            text.length > initialTextLength
              ? `+${text.length - initialTextLength} chars`
              : "sem melhoria",
        });

        // Limpar recursos
        await parser.destroy();

        if (text.length < 100) {
          console.warn(`⚠️ ATENÇÃO: Ainda pouco texto extraído (${text.length} chars).`);
          console.log(`📝 Texto completo:`, text);
        } else {
          console.log(`✅ Texto extraído com sucesso!`);
          console.log(`📝 Primeiros 300 caracteres: ${text.substring(0, 300)}...`);
        }
        break;

      case ".docx":
        const docxResult = await mammoth.extractRawText({ buffer });
        text = docxResult.value;
        break;

      case ".txt":
      case ".html":
      case ".htm":
        text = buffer.toString("utf-8");
        break;

      default:
        throw new Error(`Formato não suportado: ${ext}`);
    }

    // Normalizar texto
    text = this.normalizeText(text);

    return { text, metadata };
  }

  normalizeText(text: string): string {
    // Remover caracteres de controle
    text = text.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g, "");
    // Normalizar quebras de linha
    text = text.replace(/\r\n|\r/g, "\n");
    // Normalizar espaços múltiplos
    text = text.replace(/[ \t]+/g, " ");
    // Remover linhas vazias múltiplas
    text = text.replace(/\n{3,}/g, "\n\n");
    return text.trim();
  }
}
