/**
 * Estratégia de retry com exponential backoff
 */
/**
 * Estratégia de retry
 */
export declare class RetryStrategy {
  readonly maxRetries: number;
  private baseDelay;
  constructor(maxRetries?: number, baseDelay?: number);
  /**
   * Calcula delay para retry usando exponential backoff
   */
  getDelay(retryCount: number): number;
  /**
   * Verifica se deve tentar novamente
   */
  shouldRetry(retryCount: number): boolean;
  /**
   * Aguarda antes de retry
   */
  waitBeforeRetry(retryCount: number): Promise<void>;
}
//# sourceMappingURL=retryStrategy.d.ts.map
