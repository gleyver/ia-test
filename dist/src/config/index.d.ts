/**
 * Configuração centralizada do sistema
 * Valida e tipa todas as variáveis de ambiente
 */
import { z } from "zod";
declare const configSchema: z.ZodObject<
  {
    nodeEnv: z.ZodDefault<
      z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
      }>
    >;
    port: z.ZodDefault<z.ZodNumber>;
    rag: z.ZodObject<
      {
        chunkSize: z.ZodDefault<z.ZodNumber>;
        chunkOverlap: z.ZodDefault<z.ZodNumber>;
        embeddingModel: z.ZodDefault<z.ZodString>;
      },
      z.core.$strip
    >;
    ollama: z.ZodObject<
      {
        url: z.ZodDefault<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        maxConcurrent: z.ZodDefault<z.ZodNumber>;
        timeout: z.ZodDefault<z.ZodNumber>;
        numPredict: z.ZodDefault<z.ZodNumber>;
        temperature: z.ZodDefault<z.ZodNumber>;
        topP: z.ZodDefault<z.ZodNumber>;
      },
      z.core.$strip
    >;
    files: z.ZodObject<
      {
        maxSize: z.ZodDefault<z.ZodNumber>;
        allowedTypes: z.ZodDefault<z.ZodArray<z.ZodString>>;
      },
      z.core.$strip
    >;
    sessions: z.ZodObject<
      {
        maxAgeMinutes: z.ZodDefault<z.ZodNumber>;
        cleanupIntervalMinutes: z.ZodDefault<z.ZodNumber>;
        dbPath: z.ZodDefault<z.ZodString>;
      },
      z.core.$strip
    >;
    rateLimit: z.ZodObject<
      {
        windowMs: z.ZodDefault<z.ZodNumber>;
        maxRequests: z.ZodDefault<z.ZodNumber>;
      },
      z.core.$strip
    >;
    redis: z.ZodObject<
      {
        host: z.ZodDefault<z.ZodString>;
        port: z.ZodDefault<z.ZodNumber>;
        password: z.ZodOptional<z.ZodString>;
        db: z.ZodDefault<z.ZodNumber>;
        enabled: z.ZodDefault<z.ZodBoolean>;
      },
      z.core.$strip
    >;
    logging: z.ZodObject<
      {
        level: z.ZodDefault<
          z.ZodEnum<{
            error: "error";
            fatal: "fatal";
            warn: "warn";
            info: "info";
            debug: "debug";
            trace: "trace";
          }>
        >;
      },
      z.core.$strip
    >;
    circuitBreaker: z.ZodObject<
      {
        timeout: z.ZodDefault<z.ZodNumber>;
        errorThresholdPercentage: z.ZodDefault<z.ZodNumber>;
        resetTimeout: z.ZodDefault<z.ZodNumber>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const config: {
  nodeEnv: "development" | "production" | "test";
  port: number;
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    embeddingModel: string;
  };
  ollama: {
    url: string;
    model: string;
    maxConcurrent: number;
    timeout: number;
    numPredict: number;
    temperature: number;
    topP: number;
  };
  files: {
    maxSize: number;
    allowedTypes: string[];
  };
  sessions: {
    maxAgeMinutes: number;
    cleanupIntervalMinutes: number;
    dbPath: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  redis: {
    host: string;
    port: number;
    db: number;
    enabled: boolean;
    password?: string | undefined;
  };
  logging: {
    level: "error" | "fatal" | "warn" | "info" | "debug" | "trace";
  };
  circuitBreaker: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
  };
};
export type Config = z.infer<typeof configSchema>;
export {};
//# sourceMappingURL=index.d.ts.map
