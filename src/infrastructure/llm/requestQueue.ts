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
export class RequestQueue<T> {
  private queue: QueuedRequest<T>[] = [];
  private activeRequests = 0;
  public readonly maxConcurrent: number;

  constructor(maxConcurrent: number = 20) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Adiciona requisição à fila
   */
  enqueue(request: QueuedRequest<T>): void {
    this.queue.push(request);
    this.processQueue();
  }

  /**
   * Processa fila respeitando limite de concorrência
   */
  private async processQueue(): Promise<void> {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) {
      return;
    }

    this.activeRequests++;

    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.activeRequests--;
      // Processar próxima requisição na fila
      this.processQueue();
    }
  }

  /**
   * Retorna número de requisições ativas
   */
  getActiveCount(): number {
    return this.activeRequests;
  }

  /**
   * Retorna tamanho da fila
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Limpa fila
   */
  clear(): void {
    this.queue.forEach((request) => {
      request.reject(new Error("Queue cleared"));
    });
    this.queue = [];
  }
}
