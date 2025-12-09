/**
 * Middleware RBAC para controle de acesso baseado em roles
 */

import { Context, Next } from "hono";
import { RBAC, Role } from "../../infrastructure/auth/rbac.js";
import { AppError } from "../../shared/errors/errors.js";

const rbac = new RBAC();

/**
 * Middleware que verifica se usuário tem permissão
 */
export function requirePermission(resource: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      throw new AppError("Autenticação necessária", "UNAUTHORIZED", 401);
    }

    const userRole = user.role as Role;

    if (!rbac.can(userRole, resource, action)) {
      throw new AppError(
        `Acesso negado: você não tem permissão para ${action} em ${resource}`,
        "FORBIDDEN",
        403
      );
    }

    await next();
  };
}

/**
 * Middleware que verifica se usuário tem role específica
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      throw new AppError("Autenticação necessária", "UNAUTHORIZED", 401);
    }

    const userRole = user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError(`Acesso negado: role ${userRole} não tem permissão`, "FORBIDDEN", 403);
    }

    await next();
  };
}
