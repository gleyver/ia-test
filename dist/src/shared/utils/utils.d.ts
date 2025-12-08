/**
 * Utilitários matemáticos para cálculos vetoriais
 * Otimizado para performance
 */
/**
 * Calcula similaridade de cosseno entre dois vetores
 * Versão otimizada com suporte a norms pré-computados
 */
export declare function cosineSimilarity(
  vecA: number[],
  vecB: number[],
  normA?: number,
  normB?: number
): number;
/**
 * Calcula e retorna a norm (magnitude) de um vetor
 * Retorna a soma dos quadrados (não sqrt) para armazenar
 * Calcular sqrt apenas quando necessário (durante similarity)
 */
export declare function calculateNorm(vec: number[]): number;
/**
 * Calcula distância euclidiana entre dois vetores
 */
export declare function euclideanDistance(vecA: number[], vecB: number[]): number;
//# sourceMappingURL=utils.d.ts.map
