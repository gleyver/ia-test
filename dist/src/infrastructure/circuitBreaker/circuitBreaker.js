/**
 * Circuit Breaker para proteger contra falhas em cascata
 * Implementação simples baseada em estado
 */
import { config } from "../../config/index.js";
import { logger } from "../../shared/logging/logger.js";
export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (CircuitState = {}));
export class CircuitBreaker {
    stats;
    timeout;
    errorThresholdPercentage;
    resetTimeout;
    constructor({ timeout = config.circuitBreaker.timeout, errorThresholdPercentage = config.circuitBreaker.errorThresholdPercentage, resetTimeout = config.circuitBreaker.resetTimeout, } = {}) {
        this.timeout = timeout;
        this.errorThresholdPercentage = errorThresholdPercentage;
        this.resetTimeout = resetTimeout;
        this.stats = {
            failures: 0,
            successes: 0,
            lastFailureTime: null,
            state: CircuitState.CLOSED,
        };
    }
    /**
     * Executa função com proteção de circuit breaker
     */
    async execute(fn, fallback) {
        // Verificar se deve tentar resetar
        if (this.stats.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.stats.state = CircuitState.HALF_OPEN;
                logger.info("Circuit breaker: tentando resetar (HALF_OPEN)");
            }
            else {
                logger.warn("Circuit breaker: OPEN - bloqueando requisição");
                if (fallback) {
                    return fallback();
                }
                throw new Error("Circuit breaker está OPEN - serviço indisponível");
            }
        }
        try {
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), this.timeout)),
            ]);
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            if (fallback) {
                logger.warn({ error }, "Erro no circuit breaker, usando fallback");
                return fallback();
            }
            throw error;
        }
    }
    onSuccess() {
        if (this.stats.state === CircuitState.HALF_OPEN) {
            // Se estava testando e funcionou, fechar circuit
            this.stats.state = CircuitState.CLOSED;
            this.stats.failures = 0;
            this.stats.successes = 0;
            logger.info("Circuit breaker: CLOSED - serviço recuperado");
        }
        else {
            this.stats.successes++;
            // Resetar contadores após sucessos consecutivos
            if (this.stats.successes > 10) {
                this.stats.failures = 0;
            }
        }
    }
    onFailure() {
        this.stats.failures++;
        this.stats.lastFailureTime = Date.now();
        const total = this.stats.failures + this.stats.successes;
        const errorRate = total > 0 ? (this.stats.failures / total) * 100 : 0;
        if (this.stats.state === CircuitState.HALF_OPEN) {
            // Se estava testando e falhou, abrir novamente
            this.stats.state = CircuitState.OPEN;
            logger.error("Circuit breaker: OPEN - teste de recuperação falhou");
        }
        else if (errorRate >= this.errorThresholdPercentage && total >= 5) {
            // Abrir circuit se taxa de erro exceder threshold
            this.stats.state = CircuitState.OPEN;
            logger.error({ errorRate: errorRate.toFixed(2), failures: this.stats.failures }, "Circuit breaker: OPEN - muitos erros");
        }
    }
    shouldAttemptReset() {
        if (!this.stats.lastFailureTime) {
            return true;
        }
        return Date.now() - this.stats.lastFailureTime >= this.resetTimeout;
    }
    getState() {
        return this.stats.state;
    }
    getStats() {
        return { ...this.stats };
    }
    reset() {
        this.stats = {
            failures: 0,
            successes: 0,
            lastFailureTime: null,
            state: CircuitState.CLOSED,
        };
        logger.info("Circuit breaker: resetado manualmente");
    }
}
//# sourceMappingURL=circuitBreaker.js.map