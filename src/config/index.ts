/**
 * Configuração centralizada do sistema
 * Valida e tipa todas as variáveis de ambiente
 */

import { z } from "zod";

const configSchema = z.object({
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.number().int().positive().default(3000),

  rag: z.object({
    chunkSize: z.number().int().positive().default(1000),
    chunkOverlap: z.number().int().nonnegative().default(200),
    embeddingModel: z.string().default("Xenova/all-MiniLM-L6-v2"),
  }),

  ollama: z.object({
    url: z.string().url().default("http://localhost:11434"),
    model: z.string().default("llama3.2"),
    maxConcurrent: z.number().int().positive().default(20),
    timeout: z.number().int().positive().default(120000),
    numPredict: z.number().int().positive().default(2000),
    temperature: z.number().min(0).max(2).default(0.7),
    topP: z.number().min(0).max(1).default(0.9),
  }),

  files: z.object({
    maxSize: z
      .number()
      .int()
      .positive()
      .default(50 * 1024 * 1024), // 50MB
    allowedTypes: z
      .array(z.string())
      .default([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/html",
      ]),
  }),

  sessions: z.object({
    maxAgeMinutes: z.number().int().positive().default(60),
    cleanupIntervalMinutes: z.number().int().positive().default(30),
    dbPath: z.string().default("./vector_db"),
  }),

  rateLimit: z.object({
    windowMs: z
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000), // 15min
    maxRequests: z.number().int().positive().default(100),
  }),

  redis: z.object({
    host: z.string().default("localhost"),
    port: z.number().int().positive().default(6379),
    password: z.string().optional(),
    db: z.number().int().nonnegative().default(0),
    enabled: z.boolean().default(false), // Desabilitado por padrão
  }),

  logging: z.object({
    level: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  }),

  circuitBreaker: z.object({
    timeout: z.number().int().positive().default(120000), // 120 segundos (2 minutos)
    errorThresholdPercentage: z.number().int().min(0).max(100).default(50),
    resetTimeout: z.number().int().positive().default(30000), // 30 segundos
  }),
});

function loadConfig() {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 3000,

    rag: {
      chunkSize: Number(process.env.CHUNK_SIZE) || 1000,
      chunkOverlap: Number(process.env.CHUNK_OVERLAP) || 200,
      embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
    },

    ollama: {
      url: process.env.OLLAMA_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3.2",
      maxConcurrent: Number(process.env.OLLAMA_MAX_CONCURRENT) || 20,
      timeout: Number(process.env.OLLAMA_TIMEOUT_MS) || 120000,
      numPredict: Number(process.env.OLLAMA_NUM_PREDICT) || 2000,
      temperature: Number(process.env.OLLAMA_TEMPERATURE) || 0.7,
      topP: Number(process.env.OLLAMA_TOP_P) || 0.9,
    },

    files: {
      maxSize: Number(process.env.MAX_FILE_SIZE_MB)
        ? Number(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024
        : 50 * 1024 * 1024,
      allowedTypes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/html",
      ],
    },

    sessions: {
      maxAgeMinutes: Number(process.env.SESSION_MAX_AGE_MINUTES) || 60,
      cleanupIntervalMinutes: Number(process.env.SESSION_CLEANUP_INTERVAL_MINUTES) || 30,
      dbPath: process.env.VECTOR_DB_PATH || "./vector_db",
    },

    rateLimit: {
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },

    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB) || 0,
      enabled: process.env.REDIS_ENABLED === "true",
    },

    logging: {
      level: (process.env.LOG_LEVEL || "info") as
        | "fatal"
        | "error"
        | "warn"
        | "info"
        | "debug"
        | "trace",
    },

    circuitBreaker: {
      timeout: Number(process.env.CIRCUIT_BREAKER_TIMEOUT) || 120000, // 120 segundos
      errorThresholdPercentage: Number(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD) || 50,
      resetTimeout: Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 30000,
    },
  };

  return configSchema.parse(rawConfig);
}

export const config = loadConfig();
export type Config = z.infer<typeof configSchema>;
