/**
 * Validadores de entrada e arquivos
 * Previne vulnerabilidades e garante dados válidos
 */
import { fileTypeFromBuffer } from "file-type";
import { basename, extname } from "path";
import { ValidationError } from "../shared/errors/errors.js";
import { FileSize } from "./valueObjects/fileSize.js";
// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/plain",
    "text/html",
];
// Extensões permitidas
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".html", ".htm"];
// Tamanho máximo de query
const MAX_QUERY_LENGTH = 10000;
/**
 * Valida e sanitiza nome de arquivo
 */
export function sanitizeFilename(filename) {
    // Remover path traversal e caracteres perigosos
    const sanitized = basename(filename)
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 255); // Limitar tamanho
    if (!sanitized || sanitized.length === 0) {
        throw new ValidationError("Nome de arquivo inválido");
    }
    return sanitized;
}
/**
 * Valida extensão do arquivo
 */
export function validateExtension(filename) {
    const ext = extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new ValidationError(`Extensão não suportada: ${ext}. Extensões permitidas: ${ALLOWED_EXTENSIONS.join(", ")}`);
    }
}
/**
 * Valida tamanho do arquivo usando FileSize Value Object
 */
export function validateFileSize(size) {
    const fileSize = FileSize.fromBytes(size);
    if (fileSize.exceedsMax()) {
        throw new ValidationError(`Arquivo muito grande: ${fileSize.toFormattedString()}. Máximo permitido: ${FileSize.fromBytes(FileSize.MAX_BYTES).toFormattedString()}`);
    }
    if (fileSize.toBytes() === 0) {
        throw new ValidationError("Arquivo vazio");
    }
}
/**
 * Valida tipo MIME real do arquivo (não apenas extensão)
 */
export async function validateMimeType(buffer, filename) {
    const fileType = await fileTypeFromBuffer(buffer);
    // Se file-type não conseguir detectar, verificar extensão como fallback
    if (!fileType) {
        const ext = extname(filename).toLowerCase();
        if (ext === ".txt" || ext === ".html" || ext === ".htm") {
            // Arquivos de texto podem não ter magic bytes, permitir se extensão for válida
            return;
        }
        throw new ValidationError("Não foi possível determinar o tipo do arquivo. Arquivo pode estar corrompido.");
    }
    // Validar tipo MIME real
    if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
        throw new ValidationError(`Tipo de arquivo não suportado: ${fileType.mime}. Tipos permitidos: ${ALLOWED_MIME_TYPES.join(", ")}`);
    }
}
/**
 * Sanitiza query para prevenir prompt injection
 */
export function sanitizeQuery(query) {
    if (!query || typeof query !== "string") {
        throw new ValidationError("Query inválida");
    }
    // Remover caracteres de controle e caracteres perigosos
    const sanitized = query
        .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, "") // Caracteres de controle
        .trim();
    // Validar tamanho
    if (sanitized.length === 0) {
        throw new ValidationError("Query não pode estar vazia");
    }
    if (sanitized.length > MAX_QUERY_LENGTH) {
        throw new ValidationError(`Query muito longa. Máximo ${MAX_QUERY_LENGTH} caracteres.`);
    }
    // Detectar possíveis tentativas de prompt injection
    const suspiciousPatterns = [
        /ignore\s+(previous|above|all)\s+(instructions?|commands?)/i,
        /system\s*:\s*[^\n]*/i,
        /\[INST\]|\[\/INST\]/i,
        /<\|im_start\||<\|im_end\|>/i,
    ];
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(sanitized)) {
            // Log mas não bloquear (pode ser falso positivo)
            // Em produção, você pode querer bloquear ou alertar
            console.warn("⚠️ Possível tentativa de prompt injection detectada");
        }
    }
    return sanitized;
}
/**
 * Valida arquivo completo (tamanho, extensão, tipo MIME)
 */
export async function validateFile(buffer, filename, size) {
    // 1. Validar tamanho
    validateFileSize(size);
    // 2. Sanitizar nome
    const sanitizedFilename = sanitizeFilename(filename);
    // 3. Validar extensão
    validateExtension(sanitizedFilename);
    // 4. Validar tipo MIME real
    await validateMimeType(buffer, sanitizedFilename);
}
//# sourceMappingURL=validators.js.map