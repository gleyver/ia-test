/**
 * Middleware de autenticação JWT
 * Valida tokens e injeta informações do usuário no contexto
 */
import { JWTService } from "../../infrastructure/auth/jwtService.js";
import { AppError } from "../../shared/errors/errors.js";
import { logger } from "../../shared/logging/logger.js";
const jwtService = new JWTService();
/**
 * Middleware de autenticação obrigatória
 */
export function requireAuth() {
    return async (c, next) => {
        try {
            const token = extractToken(c);
            if (!token) {
                throw new AppError("Token de autenticação não fornecido", "UNAUTHORIZED", 401);
            }
            const payload = jwtService.verifyToken(token);
            c.set("user", {
                userId: payload.userId,
                role: payload.role,
                email: payload.email,
            });
            await next();
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn({ error: errorMessage }, "Falha na autenticação");
            throw new AppError("Token inválido ou expirado", "UNAUTHORIZED", 401);
        }
    };
}
/**
 * Middleware de autenticação opcional
 * Se tiver token, valida; se não, continua sem usuário
 */
export function optionalAuth() {
    return async (c, next) => {
        try {
            const token = extractToken(c);
            if (token) {
                const payload = jwtService.verifyToken(token);
                c.set("user", {
                    userId: payload.userId,
                    role: payload.role,
                    email: payload.email,
                });
            }
        }
        catch {
            // Ignorar erros de autenticação opcional
        }
        await next();
    };
}
/**
 * Extrai token do header Authorization
 */
function extractToken(c) {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
        return null;
    }
    // Suporta "Bearer <token>" ou apenas "<token>"
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    return authHeader;
}
//# sourceMappingURL=authMiddleware.js.map