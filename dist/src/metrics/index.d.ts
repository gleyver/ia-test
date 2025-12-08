/**
 * Métricas Prometheus para observabilidade
 */
import { Counter, Gauge, Histogram, Registry } from "prom-client";
export declare const register: Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpRequestDuration: Histogram<"method" | "route" | "status">;
export declare const httpRequestsTotal: Counter<"method" | "route" | "status">;
export declare const documentsProcessed: Counter<"type" | "status">;
export declare const documentProcessingDuration: Histogram<"type">;
export declare const embeddingCacheHits: Counter<string>;
export declare const embeddingCacheMisses: Counter<string>;
export declare const embeddingsGenerated: Counter<string>;
export declare const embeddingGenerationDuration: Histogram<string>;
export declare const queriesProcessed: Counter<"has_file">;
export declare const queryProcessingDuration: Histogram<"has_file">;
export declare const ollamaRequests: Counter<"status">;
export declare const ollamaRequestDuration: Histogram<string>;
export declare const ollamaCircuitBreakerState: Gauge<string>;
export declare const vectorDbDocuments: Gauge<"collection">;
export declare const vectorDbSearchDuration: Histogram<"collection">;
export declare const memoryUsage: Gauge<"type">;
export declare const activeSessions: Gauge<string>;
//# sourceMappingURL=index.d.ts.map
