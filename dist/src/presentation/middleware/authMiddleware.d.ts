/**
 * Middleware de autenticação JWT
 * Valida tokens e injeta informações do usuário no contexto
 */
import { Context, Next } from "hono";
import { Role } from "../../infrastructure/auth/rbac.js";
export interface AuthContext {
  userId: string;
  role: Role;
  email?: string;
}
declare module "hono" {
  interface Context {
    user?: AuthContext;
  }
}
/**
 * Middleware de autenticação obrigatória
 */
export declare function requireAuth(): (c: Context, next: Next) => Promise<void>;
/**
 * Middleware de autenticação opcional
 * Se tiver token, valida; se não, continua sem usuário
 */
export declare function optionalAuth(): (c: Context, next: Next) => Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map
