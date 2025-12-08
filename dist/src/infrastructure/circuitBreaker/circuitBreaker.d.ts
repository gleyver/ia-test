/**
 * Circuit Breaker para proteger contra falhas em cascata
 * Implementação simples baseada em estado
 */
export declare enum CircuitState {
  CLOSED = "CLOSED", // Normal, permitindo requisições
  OPEN = "OPEN", // Bloqueando requisições após muitos erros
  HALF_OPEN = "HALF_OPEN",
}
interface CircuitBreakerStats {
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  state: CircuitState;
}
export declare class CircuitBreaker {
  private stats;
  private readonly timeout;
  private readonly errorThresholdPercentage;
  private readonly resetTimeout;
  constructor({
    timeout,
    errorThresholdPercentage,
    resetTimeout,
  }?: {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
  });
  /**
   * Executa função com proteção de circuit breaker
   */
  execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
  private onSuccess;
  private onFailure;
  private shouldAttemptReset;
  getState(): CircuitState;
  getStats(): CircuitBreakerStats;
  reset(): void;
}
export {};
//# sourceMappingURL=circuitBreaker.d.ts.map
