/**
 * Middleware de permissão opcional
 * Verifica permissão apenas se usuário estiver autenticado
 */

import { Context, Next } from "hono";
import { RBAC, Role } from "../../infrastructure/auth/rbac.js";
import { AppError } from "../../shared/errors/errors.js";

const rbac = new RBAC();

/**
 * Middleware que verifica permissão apenas se usuário estiver autenticado
 * Se não autenticado, permite acesso (compatibilidade com versão anterior)
 */
export function optionalPermission(resource: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    // Se não autenticado, permitir acesso (compatibilidade)
    if (!user) {
      await next();
      return;
    }

    // Se autenticado, verificar permissão
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
