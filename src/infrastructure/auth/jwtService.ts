/**
 * Serviço JWT para autenticação
 * Gera e valida tokens JWT
 */

import jwt from "jsonwebtoken";
import { logger } from "../../shared/logging/logger.js";

export interface JWTPayload {
  userId: string;
  role: string;
  email?: string;
}

export interface TokenResult {
  token: string;
  expiresIn: number;
}

export class JWTService {
  private readonly secret: string;
  private readonly issuer: string = "rag-system";
  private readonly audience: string = "rag-api";
  private readonly expiresIn: string = "1h";

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.warn("JWT_SECRET não definido, usando secret padrão (NÃO SEGURO PARA PRODUÇÃO)");
      this.secret = "change-me-in-production";
    } else {
      this.secret = secret;
    }
  }

  /**
   * Gera token JWT
   */
  generateToken(payload: JWTPayload): TokenResult {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          role: payload.role,
          email: payload.email,
        },
        this.secret,
        {
          expiresIn: this.expiresIn,
          issuer: this.issuer,
          audience: this.audience,
        } as jwt.SignOptions
      );

      return {
        token,
        expiresIn: 3600, // 1 hora em segundos
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Erro ao gerar token JWT");
      throw new Error("Falha ao gerar token");
    }
  }

  /**
   * Valida e decodifica token JWT
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as JWTPayload;

      return {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token expirado");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Token inválido");
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Erro ao verificar token JWT");
      throw new Error("Falha ao verificar token");
    }
  }

  /**
   * Decodifica token sem validar (use com cuidado)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload | null;
    } catch {
      return null;
    }
  }
}
