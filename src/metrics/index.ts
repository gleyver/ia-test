/**
 * Métricas Prometheus para observabilidade
 */

import { Counter, Gauge, Histogram, Registry } from "prom-client";
import { logger } from "../shared/logging/logger.js";

export const register = new Registry();

// Métricas HTTP
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duração das requisições HTTP em segundos",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total de requisições HTTP",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

// Métricas de documentos
export const documentsProcessed = new Counter({
  name: "documents_processed_total",
  help: "Total de documentos processados",
  labelNames: ["type", "status"],
  registers: [register],
});

export const documentProcessingDuration = new Histogram({
  name: "document_processing_duration_seconds",
  help: "Duração do processamento de documentos em segundos",
  labelNames: ["type"],
  registers: [register],
});

// Métricas de embeddings
export const embeddingCacheHits = new Counter({
  name: "embedding_cache_hits_total",
  help: "Total de cache hits de embeddings",
  registers: [register],
});

export const embeddingCacheMisses = new Counter({
  name: "embedding_cache_misses_total",
  help: "Total de cache misses de embeddings",
  registers: [register],
});

export const embeddingsGenerated = new Counter({
  name: "embeddings_generated_total",
  help: "Total de embeddings gerados",
  registers: [register],
});

export const embeddingGenerationDuration = new Histogram({
  name: "embedding_generation_duration_seconds",
  help: "Duração da geração de embeddings em segundos",
  registers: [register],
});

// Métricas de queries
export const queriesProcessed = new Counter({
  name: "queries_processed_total",
  help: "Total de queries processadas",
  labelNames: ["has_file"],
  registers: [register],
});

export const queryProcessingDuration = new Histogram({
  name: "query_processing_duration_seconds",
  help: "Duração do processamento de queries em segundos",
  labelNames: ["has_file"],
  registers: [register],
});

// Métricas de Ollama
export const ollamaRequests = new Counter({
  name: "ollama_requests_total",
  help: "Total de requisições ao Ollama",
  labelNames: ["status"],
  registers: [register],
});

export const ollamaRequestDuration = new Histogram({
  name: "ollama_request_duration_seconds",
  help: "Duração das requisições ao Ollama em segundos",
  registers: [register],
});

export const ollamaCircuitBreakerState = new Gauge({
  name: "ollama_circuit_breaker_state",
  help: "Estado do circuit breaker do Ollama (0=CLOSED, 1=OPEN, 2=HALF_OPEN)",
  registers: [register],
});

// Métricas de VectorDB
export const vectorDbDocuments = new Gauge({
  name: "vectordb_documents_total",
  help: "Total de documentos na VectorDB",
  labelNames: ["collection"],
  registers: [register],
});

export const vectorDbSearchDuration = new Histogram({
  name: "vectordb_search_duration_seconds",
  help: "Duração das buscas na VectorDB em segundos",
  labelNames: ["collection"],
  registers: [register],
});

// Métricas de sistema
export const memoryUsage = new Gauge({
  name: "nodejs_memory_usage_bytes",
  help: "Uso de memória do Node.js em bytes",
  labelNames: ["type"],
  registers: [register],
});

export const activeSessions = new Gauge({
  name: "active_sessions_total",
  help: "Total de sessões ativas",
  registers: [register],
});

// Coletar métricas de sistema periodicamente
if (typeof process !== "undefined") {
  setInterval(() => {
    const usage = process.memoryUsage();
    memoryUsage.set({ type: "heap_used" }, usage.heapUsed);
    memoryUsage.set({ type: "heap_total" }, usage.heapTotal);
    memoryUsage.set({ type: "external" }, usage.external);
    memoryUsage.set({ type: "rss" }, usage.rss);
  }, 10000); // A cada 10 segundos

  logger.info("Métricas Prometheus configuradas");
}
