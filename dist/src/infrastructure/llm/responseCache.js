/**
 * Cache de respostas do LLM
 * Gerencia cache com TTL e tamanho máximo
 */
import { createHash } from "crypto";
/**
 * Cache de respostas do LLM
 */
export class ResponseCache {
    cache;
    maxAge; // em milissegundos
    maxSize;
    constructor(maxAgeMinutes = 5, maxSize = 1000) {
        this.cache = new Map();
        this.maxAge = maxAgeMinutes * 60 * 1000;
        this.maxSize = maxSize;
    }
    /**
     * Gera hash do prompt para usar como chave de cache
     */
    getCacheKey(prompt) {
        return createHash("sha256").update(prompt).digest("hex");
    }
    /**
     * Obtém resposta do cache se válida
     */
    get(prompt) {
        const key = this.getCacheKey(prompt);
        const cached = this.cache.get(key);
        if (!cached) {
            return null;
        }
        // Verificar se expirou
        const age = Date.now() - cached.timestamp;
        if (age > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        return cached.response;
    }
    /**
     * Armazena resposta no cache
     */
    set(prompt, response) {
        const key = this.getCacheKey(prompt);
        // Limpar cache se exceder tamanho máximo
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(key, {
            response,
            timestamp: Date.now(),
        });
    }
    /**
     * Remove entradas mais antigas do cache
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTimestamp = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp < oldestTimestamp) {
                oldestTimestamp = value.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
    /**
     * Limpa cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Retorna tamanho atual do cache
     */
    size() {
        return this.cache.size;
    }
}
//# sourceMappingURL=responseCache.js.map