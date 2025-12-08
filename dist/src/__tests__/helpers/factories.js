/**
 * Factories para criar dados de teste
 * Facilita criação de objetos de teste consistentes
 */
import { DocumentId } from "../../domain/valueObjects/documentId.js";
import { FileSize } from "../../domain/valueObjects/fileSize.js";
import { Query } from "../../domain/valueObjects/query.js";
import { SessionId } from "../../domain/valueObjects/sessionId.js";
/**
 * Cria um Query de teste
 */
export function createTestQuery(text = "Qual é o conteúdo do documento?") {
    return Query.fromString(text);
}
/**
 * Cria um SessionId de teste
 */
export function createTestSessionId() {
    return SessionId.generate();
}
/**
 * Cria um DocumentId de teste
 */
export function createTestDocumentId() {
    return DocumentId.generate();
}
/**
 * Cria um FileSize de teste
 */
export function createTestFileSize(bytes = 1024) {
    return FileSize.fromBytes(bytes);
}
/**
 * Cria um FileLike de teste
 */
export function createTestFile(filename = "test.pdf", content = "Conteúdo de teste", mimeType = "application/pdf") {
    const buffer = Buffer.from(content);
    return {
        name: filename,
        size: buffer.length,
        type: mimeType,
        arrayBuffer: async () => buffer.buffer,
    };
}
/**
 * Cria um FileLike com buffer customizado
 */
export function createTestFileWithBuffer(filename, buffer, mimeType) {
    return {
        name: filename,
        size: buffer.length,
        type: mimeType || "application/pdf",
        arrayBuffer: async () => buffer.buffer,
    };
}
/**
 * Cria um PDF mockado (apenas headers, não é um PDF válido)
 */
export function createMockPDFBuffer(pages = 1) {
    // PDF mínimo válido (apenas para testes)
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count ${pages} >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
trailer
<< /Size 4 /Root 1 0 R >>
startxref
100
%%EOF`;
    return Buffer.from(pdfContent);
}
/**
 * Cria um DOCX mockado (apenas estrutura mínima)
 */
export function createMockDOCXBuffer() {
    // ZIP mínimo (DOCX é um ZIP)
    // Apenas para testes estruturais
    return Buffer.from("PK\x03\x04"); // ZIP header
}
/**
 * Cria dados de embedding de teste
 */
export function createTestEmbedding(dimensions = 384, value = 0.1) {
    return new Array(dimensions).fill(value);
}
/**
 * Cria múltiplos embeddings de teste
 */
export function createTestEmbeddings(count, dimensions = 384, value = 0.1) {
    return Array.from({ length: count }, () => createTestEmbedding(dimensions, value));
}
/**
 * Cria chunks de texto de teste
 */
export function createTestChunks(count = 3) {
    return Array.from({ length: count }, (_, i) => ({
        text: `Chunk ${i + 1} de texto de teste`,
        metadata: {
            chunkIndex: i,
            totalChunks: count,
            source: "test.pdf",
        },
    }));
}
/**
 * Cria resultado de busca vetorial de teste
 */
export function createTestSearchResults(count = 3) {
    return Array.from({ length: count }, (_, i) => ({
        text: `Documento relevante ${i + 1}`,
        similarity: 0.95 - i * 0.1,
        metadata: {
            source: `test-${i}.pdf`,
            chunkIndex: i,
        },
    }));
}
//# sourceMappingURL=factories.js.map