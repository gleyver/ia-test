/**
 * Validação de variáveis de ambiente obrigatórias
 * Executa no startup para garantir que todas as variáveis necessárias estão configuradas
 */

import { logger } from "../shared/logging/logger.js";

interface EnvValidationRule {
  key: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
  defaultValue?: string;
}

const ENV_RULES: EnvValidationRule[] = [
  {
    key: "NODE_ENV",
    required: true,
    validator: (value) => ["development", "production", "test"].includes(value),
    errorMessage: "NODE_ENV deve ser 'development', 'production' ou 'test'",
  },
  {
    key: "JWT_SECRET",
    required: process.env.NODE_ENV === "production",
    validator: (value) => {
      if (value === "change-me-in-production" || value.length < 32) {
        return false;
      }
      return true;
    },
    errorMessage:
      "JWT_SECRET deve ter pelo menos 32 caracteres e não pode ser 'change-me-in-production' em produção",
  },
  {
    key: "PORT",
    required: false,
    validator: (value) => {
      const port = Number(value);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    errorMessage: "PORT deve ser um número entre 1 e 65535",
    defaultValue: "3000",
  },
  {
    key: "OLLAMA_URL",
    required: false,
    validator: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: "OLLAMA_URL deve ser uma URL válida",
    defaultValue: "http://localhost:11434",
  },
];

/**
 * Valida todas as variáveis de ambiente obrigatórias
 * @throws Error se alguma variável obrigatória estiver ausente ou inválida
 */
export function validateRequiredEnvVars(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of ENV_RULES) {
    const value = process.env[rule.key];

    // Verificar se é obrigatório
    if (rule.required && !value) {
      errors.push(`Variável de ambiente obrigatória ausente: ${rule.key}`);
      continue;
    }

    // Se não tem valor e não é obrigatório, usar default se disponível
    if (!value && rule.defaultValue) {
      process.env[rule.key] = rule.defaultValue;
      logger.info(
        { key: rule.key, defaultValue: rule.defaultValue },
        "Usando valor padrão para variável de ambiente"
      );
      continue;
    }

    // Se tem valor, validar
    if (value && rule.validator) {
      if (!rule.validator(value)) {
        const errorMsg = rule.errorMessage || `Valor inválido para ${rule.key}`;
        if (rule.required) {
          errors.push(`${rule.key}: ${errorMsg}`);
        } else {
          warnings.push(`${rule.key}: ${errorMsg} (usando valor padrão)`);
        }
      }
    }
  }

  // Logar warnings (não críticos)
  if (warnings.length > 0) {
    warnings.forEach((warning) => logger.warn({ warning }, "Aviso de validação de ambiente"));
  }

  // Lançar erro se houver problemas críticos
  if (errors.length > 0) {
    const errorMessage = `Erros de validação de variáveis de ambiente:\n${errors.join("\n")}`;
    logger.error({ errors }, "Falha na validação de variáveis de ambiente");
    throw new Error(errorMessage);
  }

  // Validações adicionais específicas
  validateAdditionalRules();

  logger.info("Validação de variáveis de ambiente concluída com sucesso");
}

/**
 * Validações adicionais específicas do sistema
 */
function validateAdditionalRules(): void {
  const nodeEnv = process.env.NODE_ENV;

  // Em produção, JWT_SECRET é obrigatório e deve ser seguro
  if (nodeEnv === "production") {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET é obrigatório em produção");
    }
    if (jwtSecret === "change-me-in-production" || jwtSecret.length < 32) {
      throw new Error(
        "JWT_SECRET em produção deve ter pelo menos 32 caracteres e não pode ser o valor padrão"
      );
    }
  }

  // Validar ALLOWED_ORIGINS se fornecido
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (allowedOrigins) {
    const origins = allowedOrigins.split(",");
    for (const origin of origins) {
      try {
        new URL(origin.trim());
      } catch {
        throw new Error(`ALLOWED_ORIGINS contém origem inválida: ${origin}`);
      }
    }
  }

  // Validar REDIS se habilitado
  if (process.env.REDIS_ENABLED === "true") {
    if (!process.env.REDIS_HOST) {
      logger.warn("REDIS_ENABLED=true mas REDIS_HOST não definido, usando 'localhost'");
    }
  }
}
