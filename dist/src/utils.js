/**
 * Utilitários matemáticos para cálculos vetoriais
 */
/**
 * Calcula similaridade de cosseno entre dois vetores
 */
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error("Vetores devem ter o mesmo tamanho");
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
        return 0;
    }
    return dotProduct / denominator;
}
/**
 * Calcula distância euclidiana entre dois vetores
 */
export function euclideanDistance(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error("Vetores devem ter o mesmo tamanho");
    }
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
//# sourceMappingURL=utils.js.map