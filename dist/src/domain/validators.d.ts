/**
 * Validadores de entrada e arquivos
 * Previne vulnerabilidades e garante dados válidos
 */
/**
 * Valida e sanitiza nome de arquivo
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Valida extensão do arquivo
 */
export declare function validateExtension(filename: string): void;
/**
 * Valida tamanho do arquivo usando FileSize Value Object
 */
export declare function validateFileSize(size: number): void;
/**
 * Valida tipo MIME real do arquivo (não apenas extensão)
 */
export declare function validateMimeType(buffer: Buffer, filename: string): Promise<void>;
/**
 * Sanitiza query para prevenir prompt injection
 */
export declare function sanitizeQuery(query: string): string;
/**
 * Valida arquivo completo (tamanho, extensão, tipo MIME)
 */
export declare function validateFile(buffer: Buffer, filename: string, size: number): Promise<void>;
//# sourceMappingURL=validators.d.ts.map
