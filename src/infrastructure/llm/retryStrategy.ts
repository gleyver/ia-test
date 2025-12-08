/**
 * Estratégia de retry com exponential backoff
 */

/**
 * Estratégia de retry
 */
export class RetryStrategy {
  public readonly maxRetries: number;
  private baseDelay: number; // em milissegundos

  constructor(maxRetries: number = 3, baseDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  /**
   * Calcula delay para retry usando exponential backoff
   */
  getDelay(retryCount: number): number {
    return this.baseDelay * Math.pow(2, retryCount);
  }

  /**
   * Verifica se deve tentar novamente
   */
  shouldRetry(retryCount: number): boolean {
    return retryCount < this.maxRetries;
  }

  /**
   * Aguarda antes de retry
   */
  async waitBeforeRetry(retryCount: number): Promise<void> {
    const delay = this.getDelay(retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
