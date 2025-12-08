/**
 * Fila de requisições para LLM
 * Gerencia concorrência e fila de requisições
 */
export interface QueuedRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  execute: () => Promise<T>;
  retryCount: number;
}
/**
 * Fila de requisições com controle de concorrência
 */
export declare class RequestQueue<T> {
  private queue;
  private activeRequests;
  readonly maxConcurrent: number;
  constructor(maxConcurrent?: number);
  /**
   * Adiciona requisição à fila
   */
  enqueue(request: QueuedRequest<T>): void;
  /**
   * Processa fila respeitando limite de concorrência
   */
  private processQueue;
  /**
   * Retorna número de requisições ativas
   */
  getActiveCount(): number;
  /**
   * Retorna tamanho da fila
   */
  getQueueSize(): number;
  /**
   * Limpa fila
   */
  clear(): void;
}
//# sourceMappingURL=requestQueue.d.ts.map
