/**
 * Rotas de autenticação
 * Endpoints para login e geração de tokens
 */

import { Context, Hono } from "hono";
import { JWTService } from "../../infrastructure/auth/jwtService.js";
import { Role } from "../../infrastructure/auth/rbac.js";
import { ValidationError } from "../../shared/errors/errors.js";
import { logger } from "../../shared/logging/logger.js";

const authRoutes = new Hono();
const jwtService = new JWTService();

/**
 * POST /api/auth/login
 * Gera token JWT para usuário
 *
 * Body: { userId: string, role: "user" | "premium" | "admin", email?: string }
 *
 * NOTA: Em produção, isso deve validar credenciais contra banco de dados
 * Este é um exemplo simplificado para desenvolvimento
 */
authRoutes.post("/login", async (c: Context) => {
  try {
    const body = (await c.req.json()) as {
      userId?: string;
      role?: string;
      email?: string;
    };

    if (!body.userId) {
      throw new ValidationError("userId é obrigatório");
    }

    // Validar role
    const role = body.role || "user";
    if (!["user", "premium", "admin", "guest"].includes(role)) {
      throw new ValidationError(`Role inválida: ${role}. Use: user, premium, admin ou guest`);
    }

    // Gerar token
    const tokenResult = jwtService.generateToken({
      userId: body.userId,
      role: role as Role,
      email: body.email,
    });

    logger.info({ userId: body.userId, role }, "Token gerado com sucesso");

    return c.json({
      success: true,
      token: tokenResult.token,
      expiresIn: tokenResult.expiresIn,
      user: {
        userId: body.userId,
        role,
        email: body.email,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, "Erro ao gerar token");
    throw new ValidationError("Erro ao gerar token");
  }
});

/**
 * POST /api/auth/verify
 * Verifica se token é válido
 */
authRoutes.post("/verify", async (c: Context) => {
  try {
    const body = (await c.req.json()) as { token?: string };

    if (!body.token) {
      throw new ValidationError("Token é obrigatório");
    }

    const payload = jwtService.verifyToken(body.token);

    return c.json({
      valid: true,
      user: {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
      },
    });
  } catch (error) {
    return c.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      },
      401
    );
  }
});

export default authRoutes;
