/**
 * Gerador de respostas usando Ollama
 * Implementa Pool de Conexões + Retry com Backoff + Cache de Respostas
 */
import { request as undiciRequest } from "undici";
import { config } from "../../config/index.js";
import { ollamaCircuitBreakerState, ollamaRequestDuration, ollamaRequests, } from "../../metrics/index.js";
import { logger } from "../../shared/logging/logger.js";
import { CircuitBreaker } from "../circuitBreaker/circuitBreaker.js";
import { RequestQueue } from "./requestQueue.js";
import { ResponseCache } from "./responseCache.js";
import { RetryStrategy } from "./retryStrategy.js";
/**
 * Pool de requisições para Ollama
 * Usa composição para separar responsabilidades (cache, fila, retry)
 */
class OllamaPool {
    queue;
    cache;
    retryStrategy;
    ollamaUrl;
    model;
    circuitBreaker;
    constructor({ maxConcurrent = 20, ollamaUrl = "http://localhost:11434", model = "llama3.2", maxRetries = 3, baseRetryDelay = 1000, cacheMaxAgeMinutes = 5, maxCacheSize = 1000, } = {}) {
        // maxConcurrent pode ser sobrescrito via env OLLAMA_MAX_CONCURRENT
        const finalMaxConcurrent = Number(process.env.OLLAMA_MAX_CONCURRENT) || maxConcurrent;
        this.ollamaUrl = ollamaUrl;
        this.model = model;
        // Usar composição
        this.queue = new RequestQueue(finalMaxConcurrent);
        this.cache = new ResponseCache(cacheMaxAgeMinutes, maxCacheSize);
        this.retryStrategy = new RetryStrategy(maxRetries, baseRetryDelay);
        this.circuitBreaker = new CircuitBreaker({
            timeout: config.circuitBreaker.timeout,
            errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
            resetTimeout: config.circuitBreaker.resetTimeout,
        });
        // Atualizar métrica de circuit breaker periodicamente
        setInterval(() => {
            const state = this.circuitBreaker.getState();
            const stateValue = state === "CLOSED" ? 0 : state === "OPEN" ? 1 : 2; // HALF_OPEN = 2
            ollamaCircuitBreakerState.set(stateValue);
        }, 5000);
    }
    /**
     * Adiciona requisição à fila e processa quando houver espaço
     * Verifica cache antes de adicionar à fila
     */
    async request(prompt, retrievedDocs) {
        // Verificar cache primeiro
        const cached = this.cache.get(prompt);
        if (cached) {
            logger.debug({ promptLength: prompt.length }, "Cache hit para resposta Ollama");
            return cached;
        }
        // Executar com retry usando composição
        return this.executeWithRetry(prompt, retrievedDocs, 0);
    }
    /**
     * Executa requisição com retry usando RetryStrategy
     */
    async executeWithRetry(prompt, retrievedDocs, retryCount) {
        return new Promise((resolve, reject) => {
            this.queue.enqueue({
                resolve,
                reject,
                retryCount,
                execute: async () => {
                    try {
                        // Usar circuit breaker para proteger contra falhas em cascata
                        const result = await this.circuitBreaker.execute(() => this.callOllama(prompt, retrievedDocs), () => {
                            // Fallback quando circuit está aberto
                            return Promise.resolve({
                                response: "Serviço temporariamente indisponível. Tente novamente em alguns instantes.",
                                sources: [],
                                metadata: {
                                    model: this.model,
                                    numSources: 0,
                                },
                            });
                        });
                        // Cachear resposta bem-sucedida
                        this.cache.set(prompt, result);
                        logger.debug({ promptLength: prompt.length }, "Resposta cacheada");
                        return result;
                    }
                    catch (error) {
                        // Retry usando RetryStrategy
                        if (this.retryStrategy.shouldRetry(retryCount)) {
                            await this.retryStrategy.waitBeforeRetry(retryCount);
                            logger.warn({ retryCount: retryCount + 1, maxRetries: this.retryStrategy["maxRetries"] }, "Retry Ollama");
                            return this.executeWithRetry(prompt, retrievedDocs, retryCount + 1);
                        }
                        throw error;
                    }
                },
            });
        });
    }
    /**
     * Chama Ollama API usando undici (connection pooling)
     * Com parâmetros otimizados (configuráveis)
     */
    async callOllama(prompt, retrievedDocs) {
        const startTime = Date.now();
        try {
            // Usar configuração centralizada
            const numPredict = config.ollama.numPredict;
            const temperature = config.ollama.temperature;
            const topP = config.ollama.topP;
            logger.debug({ ollamaUrl: this.ollamaUrl, model: this.model, promptLength: prompt.length }, "Chamando Ollama API");
            // Usar undici para connection pooling e keep-alive
            // undici gerencia connection pooling automaticamente
            const response = await undiciRequest(`${this.ollamaUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    // Parâmetros configuráveis
                    num_predict: numPredict, // Configurável via OLLAMA_NUM_PREDICT (padrão: 2000)
                    temperature: temperature, // Configurável via OLLAMA_TEMPERATURE (padrão: 0.7)
                    top_p: topP, // Configurável via OLLAMA_TOP_P (padrão: 0.9)
                }),
            });
            if (response.statusCode !== 200) {
                ollamaRequests.inc({ status: "error" });
                const errorMessage = `Ollama API error: ${response.statusCode}`;
                logger.error({ statusCode: response.statusCode, ollamaUrl: this.ollamaUrl }, errorMessage);
                throw new Error(errorMessage);
            }
            const result = (await response.body.json());
            const answer = result.response || "";
            if (!answer || answer.trim().length === 0) {
                logger.warn("Ollama retornou resposta vazia");
            }
            // Extrair fontes se houver documentos
            const sources = retrievedDocs && retrievedDocs.length > 0
                ? [
                    ...new Set(retrievedDocs.map((doc) => doc.metadata?.source || "Desconhecido")),
                ]
                : [];
            const duration = (Date.now() - startTime) / 1000;
            ollamaRequestDuration.observe(duration);
            ollamaRequests.inc({ status: "success" });
            return {
                response: answer,
                sources,
                metadata: {
                    model: this.model,
                    numSources: retrievedDocs?.length || 0,
                },
            };
        }
        catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            ollamaRequestDuration.observe(duration);
            ollamaRequests.inc({ status: "error" });
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({
                error: errorMessage,
                ollamaUrl: this.ollamaUrl,
                model: this.model,
                duration
            }, "Erro ao chamar Ollama");
            throw error;
        }
    }
    /**
     * Retorna estatísticas do pool
     */
    getStats() {
        return {
            queueLength: this.queue.getQueueSize(),
            activeRequests: this.queue.getActiveCount(),
            maxConcurrent: this.queue.maxConcurrent,
            cacheSize: this.cache.size(),
            cacheMaxSize: this.cache.maxSize,
        };
    }
}
export class ResponseGenerator {
    static instance = null;
    static sharedPool = null;
    constructor() {
        // Nota: model e ollamaUrl são passados para o pool compartilhado na criação
        // Não precisamos armazená-los aqui pois o pool gerencia isso
    }
    /**
     * Singleton: retorna instância única do ResponseGenerator
     * Compartilha pool de Ollama entre todas as requisições
     */
    static getInstance({ model = "llama3.2", ollamaUrl = "http://localhost:11434", } = {}) {
        if (!ResponseGenerator.instance) {
            ResponseGenerator.instance = new ResponseGenerator();
            // Criar pool compartilhado
            // Configurações do pool (todas configuráveis via env)
            ResponseGenerator.sharedPool = new OllamaPool({
                maxConcurrent: 20, // Padrão: 20 (configurável via OLLAMA_MAX_CONCURRENT)
                ollamaUrl,
                model,
                maxRetries: 3,
                baseRetryDelay: 1000,
                cacheMaxAgeMinutes: 5, // Cache respostas por 5 minutos
                maxCacheSize: 1000, // Máximo 1000 respostas em cache
            });
            logger.info("ResponseGenerator singleton criado com pool de Ollama");
        }
        return ResponseGenerator.instance;
    }
    getPool() {
        if (!ResponseGenerator.sharedPool) {
            throw new Error("Pool não inicializado. Use getInstance() primeiro.");
        }
        return ResponseGenerator.sharedPool;
    }
    buildContext(retrievedDocs) {
        if (!retrievedDocs || retrievedDocs.length === 0) {
            return "Nenhum contexto relevante encontrado.";
        }
        // Limitar tamanho de cada documento no contexto (500 chars) e reduzir formatação
        const maxDocLength = 500;
        return retrievedDocs
            .map((doc, i) => {
            const source = doc.metadata?.source || "Desconhecido";
            const text = doc.text.length > maxDocLength
                ? doc.text.substring(0, maxDocLength) + "..."
                : doc.text;
            return `[${i + 1}] ${source}: ${text}`;
        })
            .join("\n\n");
    }
    buildPrompt(query, context, systemMessage = null) {
        if (!systemMessage) {
            // Prompt otimizado: mais curto e direto (reduz ~40% de tokens)
            systemMessage = `Você é um assistente especializado. Responda perguntas baseadas APENAS no contexto fornecido. Seja preciso e objetivo. Se não encontrar a informação no contexto, diga claramente.`;
        }
        // Prompt compacto sem repetições
        return `${systemMessage}

CONTEXTO:
${context}

PERGUNTA: ${query}

RESPOSTA:`;
    }
    async generate(query, retrievedDocs, systemMessage = null) {
        const context = this.buildContext(retrievedDocs);
        const prompt = this.buildPrompt(query, context, systemMessage);
        // Usar pool para gerenciar concorrência e retry
        const pool = this.getPool();
        return await pool.request(prompt, retrievedDocs);
    }
    /**
     * Gera resposta sem contexto de documentos (chamada direta ao modelo)
     * Usado quando não há arquivo enviado
     */
    async generateWithoutContext(query) {
        // Prompt otimizado para respostas sem contexto (mais curto)
        const systemMessage = `Você é um assistente inteligente. Responda de forma clara e precisa. Se não souber, seja honesto.`;
        const prompt = `${systemMessage}

PERGUNTA: ${query}

RESPOSTA:`;
        // Usar pool para gerenciar concorrência e retry
        const pool = this.getPool();
        return await pool.request(prompt);
    }
    /**
     * Retorna estatísticas do pool de Ollama
     */
    getPoolStats() {
        return this.getPool().getStats();
    }
    /**
     * Retorna o Circuit Breaker do pool (para monitoramento e reset)
     */
    getCircuitBreaker() {
        try {
            const pool = this.getPool();
            return pool.circuitBreaker;
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=generator.js.map