/**
 * Utilitários matemáticos para cálculos vetoriais
 * Otimizado para performance
 */

/**
 * Calcula similaridade de cosseno entre dois vetores
 * Versão otimizada com suporte a norms pré-computados
 */
export function cosineSimilarity(
  vecA: number[],
  vecB: number[],
  normA?: number,
  normB?: number
): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vetores devem ter o mesmo tamanho");
  }

  let dotProduct = 0;
  let computedNormA = normA || 0;
  let computedNormB = normB || 0;

  // Calcular dotProduct e norms (se não pré-computados)
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    if (!normA) computedNormA += vecA[i] * vecA[i];
    if (!normB) computedNormB += vecB[i] * vecB[i];
  }

  // Early exit: se dotProduct muito negativo, similarity será baixa
  // Isso ajuda a pular cálculos desnecessários
  const maxPossibleSimilarity =
    Math.abs(dotProduct) / (Math.sqrt(computedNormA) * Math.sqrt(computedNormB));
  if (maxPossibleSimilarity < 0.1) {
    return 0; // Similaridade muito baixa, não vale calcular
  }

  const sqrtNormA = normA ? Math.sqrt(normA) : Math.sqrt(computedNormA);
  const sqrtNormB = normB ? Math.sqrt(normB) : Math.sqrt(computedNormB);
  const denominator = sqrtNormA * sqrtNormB;

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Calcula e retorna a norm (magnitude) de um vetor
 * Retorna a soma dos quadrados (não sqrt) para armazenar
 * Calcular sqrt apenas quando necessário (durante similarity)
 */
export function calculateNorm(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return sum; // Retorna sum (não sqrt) para armazenar, calcular sqrt apenas quando necessário
}

/**
 * Calcula distância euclidiana entre dois vetores
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
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
