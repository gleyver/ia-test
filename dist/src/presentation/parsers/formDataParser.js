/**
 * Parser de Form-Data para requisições multipart e JSON
 * Isola lógica de parsing da camada de rota
 */
import Busboy from "busboy";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { Readable } from "stream";
import { ValidationError } from "../../shared/errors/errors.js";
import { logger } from "../../shared/logging/logger.js";
/**
 * Parser de form-data para diferentes Content-Types
 */
export class FormDataParser {
    /**
     * Parse form-data de uma requisição Hono
     */
    async parse(c) {
        const contentType = c.req.header("content-type") || "";
        if (this.isMultipart(contentType) || this.isFormUrlEncoded(contentType)) {
            return this.parseMultipart(c);
        }
        if (this.isJson(contentType)) {
            return this.parseJson(c);
        }
        throw new ValidationError("Content-Type não suportado. Use multipart/form-data, application/x-www-form-urlencoded ou application/json");
    }
    /**
     * Verifica se é multipart/form-data
     */
    isMultipart(contentType) {
        return contentType.includes("multipart/form-data");
    }
    /**
     * Verifica se é application/x-www-form-urlencoded
     */
    isFormUrlEncoded(contentType) {
        return contentType.includes("application/x-www-form-urlencoded");
    }
    /**
     * Verifica se é application/json
     */
    isJson(contentType) {
        return contentType.includes("application/json");
    }
    /**
     * Parse multipart/form-data usando Busboy
     */
    async parseMultipart(c) {
        const rawRequest = c.req.raw;
        const headers = this.extractHeaders(rawRequest.headers);
        // Fallback: usar Content-Type do Hono se não estiver nos headers extraídos
        const contentTypeFromHono = c.req.header("content-type");
        if (!headers["content-type"] && contentTypeFromHono) {
            headers["content-type"] = contentTypeFromHono;
            logger.debug({ contentType: contentTypeFromHono }, "Usando Content-Type do Hono como fallback");
        }
        // Se ainda não tiver Content-Type, tentar inferir de multipart/form-data
        if (!headers["content-type"]) {
            // Verificar se o body existe e tem características de multipart
            const bodyStream = rawRequest.body;
            if (!bodyStream) {
                throw new ValidationError("Body vazio");
            }
            // Se chegou aqui e passou pela verificação inicial de isMultipart,
            // assumir que é multipart/form-data (curl com -F sempre envia isso)
            const inferredContentType = contentTypeFromHono || "multipart/form-data";
            headers["content-type"] = inferredContentType;
            logger.debug({ contentType: inferredContentType }, "Content-Type não encontrado nos headers, usando valor inferido");
        }
        const bodyStream = rawRequest.body;
        if (!bodyStream) {
            throw new ValidationError("Body vazio");
        }
        const nodeStream = this.convertToNodeStream(bodyStream);
        const busboy = Busboy({ headers });
        return this.processBusboyStream(busboy, nodeStream);
    }
    /**
     * Extrai headers em formato objeto simples
     */
    extractHeaders(requestHeaders) {
        const headers = {};
        if (this.isHeadersObject(requestHeaders)) {
            this.forEachHeader(requestHeaders, (key, value) => {
                headers[key.toLowerCase()] = value;
            });
        }
        else {
            this.extractFromObject(requestHeaders, headers);
        }
        // Garantir que content-type está presente (case-insensitive)
        if (!headers["content-type"] && !headers["Content-Type"]) {
            // Tentar encontrar qualquer variação de case
            const contentTypeKey = Object.keys(headers).find((key) => key.toLowerCase() === "content-type");
            if (contentTypeKey) {
                headers["content-type"] = headers[contentTypeKey];
            }
        }
        else if (headers["Content-Type"]) {
            headers["content-type"] = headers["Content-Type"];
        }
        return headers;
    }
    /**
     * Verifica se é Headers object (Web API)
     */
    isHeadersObject(headers) {
        return (headers !== null &&
            typeof headers === "object" &&
            typeof headers.forEach === "function");
    }
    /**
     * Itera sobre Headers object
     */
    forEachHeader(headers, callback) {
        headers.forEach(callback);
    }
    /**
     * Extrai headers de objeto simples
     */
    extractFromObject(requestHeaders, headers) {
        Object.entries(requestHeaders).forEach(([key, value]) => {
            if (typeof value === "string") {
                headers[key.toLowerCase()] = value;
            }
            else if (Array.isArray(value) && value.length > 0) {
                headers[key.toLowerCase()] = value[0];
            }
        });
    }
    /**
     * Converte ReadableStream para Node.js Readable
     */
    convertToNodeStream(bodyStream) {
        if (bodyStream instanceof Readable) {
            return bodyStream;
        }
        return Readable.fromWeb(bodyStream);
    }
    /**
     * Processa stream do Busboy
     */
    async processBusboyStream(busboy, nodeStream) {
        return new Promise((resolve, reject) => {
            const result = {};
            busboy.on("file", (name, fileStream, info) => {
                if (name === "file") {
                    this.handleFile(fileStream, info, result, reject);
                }
            });
            busboy.on("field", (name, value) => {
                if (name === "query") {
                    result.query = value;
                }
            });
            busboy.on("finish", () => {
                resolve(result);
            });
            busboy.on("error", (error) => {
                logger.error({ error: error.message }, "Erro ao processar form-data");
                reject(new ValidationError(`Erro ao processar form-data: ${error.message}`, {
                    hint: "Certifique-se de usar Content-Type: multipart/form-data. No Postman, use form-data (não raw). No curl, use -F (não --data).",
                }));
            });
            nodeStream.pipe(busboy);
        });
    }
    /**
     * Processa arquivo do stream
     */
    handleFile(fileStream, info, result, reject) {
        const filename = info.filename || "unknown";
        const mimeType = info.mimeType || "application/octet-stream";
        const tempFilePath = join(tmpdir(), `${randomUUID()}-${filename}`);
        const writeStream = createWriteStream(tempFilePath);
        writeStream.on("finish", async () => {
            try {
                const { stat } = await import("fs/promises");
                const stats = await stat(tempFilePath);
                result.file = {
                    name: filename,
                    size: stats.size,
                    type: mimeType,
                    tempPath: tempFilePath,
                    arrayBuffer: async () => {
                        const { readFile } = await import("fs/promises");
                        const data = await readFile(tempFilePath);
                        return data.buffer;
                    },
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                reject(new Error(`Erro ao processar arquivo: ${errorMessage}`));
            }
        });
        writeStream.on("error", (error) => {
            reject(error);
        });
        fileStream.pipe(writeStream);
    }
    /**
     * Parse application/json
     */
    async parseJson(c) {
        const body = (await c.req.json());
        return {
            query: body.query || undefined,
            // JSON não suporta arquivos diretamente
        };
    }
}
//# sourceMappingURL=formDataParser.js.map