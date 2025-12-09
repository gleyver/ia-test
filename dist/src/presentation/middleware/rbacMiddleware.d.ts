/**
 * Middleware RBAC para controle de acesso baseado em roles
 */
import { Context, Next } from "hono";
import { Role } from "../../infrastructure/auth/rbac.js";
/**
 * Middleware que verifica se usuário tem permissão
 */
export declare function requirePermission(
  resource: string,
  action: string
): (c: Context, next: Next) => Promise<void>;
/**
 * Middleware que verifica se usuário tem role específica
 */
export declare function requireRole(
  ...allowedRoles: Role[]
): (c: Context, next: Next) => Promise<void>;
//# sourceMappingURL=rbacMiddleware.d.ts.map
