/**
 * Chunker de texto para Node.js
 */
export class TextChunker {
    chunkSize;
    chunkOverlap;
    constructor({ chunkSize = 1000, chunkOverlap = 200 } = {}) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
    }
    // Aproximação: 1 token ≈ 4 caracteres
    countTokens(text) {
        return Math.ceil(text.length / 4);
    }
    createChunks(text, metadata = {}) {
        if (!text.trim())
            return [];
        const chunks = [];
        const textLength = text.length;
        let start = 0;
        while (start < textLength) {
            let end = start + (this.chunkSize * 4);
            if (end >= textLength) {
                const chunk = text.slice(start).trim();
                if (chunk) {
                    chunks.push({
                        text: chunk,
                        metadata: {
                            ...metadata,
                            chunkIndex: chunks.length,
                            tokens: this.countTokens(chunk)
                        }
                    });
                }
                break;
            }
            // Ajustar fim para não cortar palavras
            const adjustPositions = [
                text.lastIndexOf('\n\n', end),
                text.lastIndexOf('\n', end),
                text.lastIndexOf('. ', end),
                text.lastIndexOf(' ', end)
            ];
            const bestPos = Math.max(...adjustPositions.filter(pos => pos > start), end);
            const chunk = text.slice(start, bestPos).trim();
            if (chunk) {
                chunks.push({
                    text: chunk,
                    metadata: {
                        ...metadata,
                        chunkIndex: chunks.length,
                        tokens: this.countTokens(chunk)
                    }
                });
            }
            // Mover start considerando overlap
            const overlapStart = bestPos - (this.chunkOverlap * 4);
            start = overlapStart > start ? overlapStart : bestPos;
        }
        // Adicionar total_chunks
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
}
//# sourceMappingURL=chunker.js.map