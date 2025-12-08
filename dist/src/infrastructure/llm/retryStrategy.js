/**
 * Estratégia de retry com exponential backoff
 */
/**
 * Estratégia de retry
 */
export class RetryStrategy {
    maxRetries;
    baseDelay; // em milissegundos
    constructor(maxRetries = 3, baseDelay = 1000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
    }
    /**
     * Calcula delay para retry usando exponential backoff
     */
    getDelay(retryCount) {
        return this.baseDelay * Math.pow(2, retryCount);
    }
    /**
     * Verifica se deve tentar novamente
     */
    shouldRetry(retryCount) {
        return retryCount < this.maxRetries;
    }
    /**
     * Aguarda antes de retry
     */
    async waitBeforeRetry(retryCount) {
        const delay = this.getDelay(retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}
//# sourceMappingURL=retryStrategy.js.map