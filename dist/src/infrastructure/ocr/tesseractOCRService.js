/**
 * Serviço de OCR usando Tesseract.js
 * Implementa IOCRService
 */
import { createCanvas, Image } from "canvas";
import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import { cpus, tmpdir } from "os";
import { join } from "path";
import { PDFParse } from "pdf-parse";
import { fromPath } from "pdf2pic";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import { logger } from "../../shared/logging/logger.js";
/**
 * Serviço de OCR usando Tesseract.js
 * Gerencia worker global e processamento paralelo
 */
export class TesseractOCRService {
    static globalOCRWorker = null;
    static workerInitializationPromise = null;
    /**
     * Obtém worker OCR global (singleton)
     */
    async getOCRWorker() {
        if (TesseractOCRService.globalOCRWorker) {
            return TesseractOCRService.globalOCRWorker;
        }
        if (TesseractOCRService.workerInitializationPromise) {
            return TesseractOCRService.workerInitializationPromise;
        }
        TesseractOCRService.workerInitializationPromise = (async () => {
            logger.info("Inicializando OCR worker global (Tesseract.js)...");
            TesseractOCRService.globalOCRWorker = await createWorker("por+eng");
            logger.info("OCR worker global inicializado!");
            TesseractOCRService.workerInitializationPromise = null;
            return TesseractOCRService.globalOCRWorker;
        })();
        return TesseractOCRService.workerInitializationPromise;
    }
    /**
     * Limpa worker OCR global
     */
    static async cleanupOCRWorker() {
        if (TesseractOCRService.globalOCRWorker) {
            await TesseractOCRService.globalOCRWorker.terminate();
            TesseractOCRService.globalOCRWorker = null;
            TesseractOCRService.workerInitializationPromise = null;
            logger.info("OCR worker global limpo");
        }
    }
    /**
     * Verifica se PDF precisa de OCR
     */
    async needsOCR(pdfBuffer, extractedText) {
        // Se texto extraído for muito curto (< 100 chars por página), provavelmente é escaneado
        try {
            const parser = new PDFParse({ data: pdfBuffer });
            const info = await parser.getInfo();
            const pages = info.total || 1;
            const charsPerPage = extractedText.length / pages;
            return charsPerPage < 100;
        }
        catch {
            return true;
        }
    }
    /**
     * Extrai texto de PDF escaneado usando OCR
     */
    async extractText(pdfBuffer) {
        logger.info("PDF parece ser escaneado, usando OCR (Tesseract.js)...");
        const worker = await this.getOCRWorker();
        try {
            logger.info("📄 Convertendo PDF para imagens e processando com OCR...");
            logger.info("⏳ Por favor, aguarde (isso pode demorar para arquivos grandes)...");
            const parser = new PDFParse({ data: pdfBuffer });
            const info = await parser.getInfo();
            const numPages = info.total || 1;
            logger.info({ numPages }, "PDF tem páginas. Processando cada página...");
            const tempPdfPath = join(tmpdir(), `${randomUUID()}.pdf`);
            await writeFile(tempPdfPath, pdfBuffer);
            try {
                const allTexts = await this.processWithPdf2Pic(tempPdfPath, numPages, worker);
                if (allTexts.length > 0) {
                    await this.cleanupTempFile(tempPdfPath);
                    return allTexts.join("\n\n").trim();
                }
            }
            catch {
                logger.warn("pdf2pic não disponível, usando pdfjs-dist + canvas como fallback");
            }
            // Fallback para pdfjs-dist
            const allTexts = await this.processWithPdfJs(pdfBuffer, numPages, worker);
            await this.cleanupTempFile(tempPdfPath);
            if (allTexts.length > 0) {
                logger.info({ textLength: allTexts.join("\n\n").length, numPages }, "OCR extraiu texto com sucesso");
                return allTexts.join("\n\n").trim();
            }
            logger.warn({ numPages }, "OCR não extraiu texto de nenhuma página");
            return "";
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ error: errorMessage }, "Erro no OCR");
            return "";
        }
    }
    /**
     * Processa PDF usando pdf2pic (mais rápido)
     */
    async processWithPdf2Pic(tempPdfPath, numPages, worker) {
        const convert = fromPath(tempPdfPath, {
            density: 200,
            saveFilename: "page",
            savePath: tmpdir(),
            format: "png",
            width: 2000,
            height: 2000,
        });
        // Testar se pdf2pic funciona
        try {
            const testResult = await convert(1, { responseType: "buffer" });
            const result = testResult;
            if (!result?.buffer || result.buffer.length === 0) {
                throw new Error("pdf2pic não retornou buffer");
            }
        }
        catch {
            throw new Error("pdf2pic não disponível");
        }
        const numCpus = cpus().length;
        const CONCURRENT_PAGES = Math.min(6, Math.max(2, Math.floor(numCpus / 2)));
        logger.debug({ concurrentPages: CONCURRENT_PAGES, numCpus }, "Configuração de concorrência OCR (pdf2pic)");
        const allTexts = [];
        for (let i = 1; i <= numPages; i += CONCURRENT_PAGES) {
            const batch = this.createPageBatch(i, CONCURRENT_PAGES, numPages);
            const results = await Promise.all(batch.map((pageNum) => this.processPageWithPdf2Pic(pageNum, convert, worker, numPages)));
            allTexts.push(...results.filter((text) => text !== null));
        }
        return allTexts;
    }
    /**
     * Processa página usando pdf2pic
     */
    async processPageWithPdf2Pic(pageNum, convert, worker, numPages) {
        try {
            logger.debug({ pageNum, totalPages: numPages, method: "pdf2pic" }, "Processando página");
            const result = (await convert(pageNum, {
                responseType: "buffer",
            }));
            if (result?.buffer && result.buffer.length > 0) {
                const { data: { text }, } = await worker.recognize(result.buffer);
                if (text && text.trim().length > 0) {
                    logger.debug({ pageNum, textLength: text.length }, "Página processada com sucesso");
                    return `=== Página ${pageNum} ===\n${text.trim()}`;
                }
            }
            return null;
        }
        catch (pageError) {
            const errorMessage = pageError instanceof Error ? pageError.message : String(pageError);
            logger.warn({ pageNum, error: errorMessage }, "Erro ao processar página");
            return null;
        }
    }
    /**
     * Processa PDF usando pdfjs-dist (fallback)
     */
    async processWithPdfJs(pdfBuffer, numPages, worker) {
        logger.info("Usando pdfjs-dist + canvas para renderização...");
        if (typeof global !== "undefined") {
            global.Image = Image;
        }
        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            verbosity: 0,
            disableAutoFetch: false,
            disableStream: false,
        });
        const pdfDoc = await loadingTask.promise;
        const numCpus = cpus().length;
        const CONCURRENT_PAGES = Math.min(4, Math.max(2, Math.floor(numCpus / 3)));
        logger.debug({ concurrentPages: CONCURRENT_PAGES, numCpus }, "Configuração de concorrência OCR (pdfjs)");
        const allTexts = [];
        for (let i = 1; i <= numPages; i += CONCURRENT_PAGES) {
            const batch = this.createPageBatch(i, CONCURRENT_PAGES, numPages);
            const results = await Promise.all(batch.map((pageNum) => this.processPageWithPdfJs(pageNum, pdfDoc, worker, numPages)));
            allTexts.push(...results.filter((text) => text !== null));
        }
        return allTexts;
    }
    /**
     * Processa página usando pdfjs-dist
     */
    async processPageWithPdfJs(pageNum, pdfDoc, worker, numPages) {
        try {
            logger.debug({ pageNum, totalPages: numPages, method: "pdfjs-dist" }, "Processando página");
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext("2d");
            try {
                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;
            }
            catch {
                // Fallback: extrair apenas texto
                const textContent = await page.getTextContent();
                const textItems = textContent.items
                    .map((item) => {
                    if (item && typeof item === "object" && "str" in item && typeof item.str === "string") {
                        return item.str;
                    }
                    return "";
                })
                    .filter((str) => str.length > 0)
                    .join(" ");
                if (textItems && textItems.trim().length > 0) {
                    logger.debug({ pageNum, textLength: textItems.length, method: "text-only" }, "Página processada (apenas texto)");
                    return `=== Página ${pageNum} ===\n${textItems.trim()}`;
                }
                return null;
            }
            const imageBuffer = canvas.toBuffer("image/png");
            const { data: { text }, } = await worker.recognize(imageBuffer);
            if (text && text.trim().length > 0) {
                logger.debug({ pageNum, textLength: text.length }, "Página processada com sucesso");
                return `=== Página ${pageNum} ===\n${text.trim()}`;
            }
            return null;
        }
        catch (pageError) {
            const errorMessage = pageError instanceof Error ? pageError.message : String(pageError);
            logger.warn({ pageNum, error: errorMessage }, "Erro ao processar página");
            return null;
        }
    }
    /**
     * Cria batch de páginas para processamento paralelo
     */
    createPageBatch(start, size, max) {
        const batch = [];
        for (let j = 0; j < size && start + j <= max; j++) {
            batch.push(start + j);
        }
        return batch;
    }
    /**
     * Limpa arquivo temporário
     */
    async cleanupTempFile(tempPath) {
        try {
            await unlink(tempPath);
        }
        catch {
            // Ignorar erro ao deletar
        }
    }
}
//# sourceMappingURL=tesseractOCRService.js.map