/**
 * Middleware de permissão opcional
 * Verifica permissão apenas se usuário estiver autenticado
 */
import { RBAC } from "../../infrastructure/auth/rbac.js";
import { AppError } from "../../shared/errors/errors.js";
const rbac = new RBAC();
/**
 * Middleware que verifica permissão apenas se usuário estiver autenticado
 * Se não autenticado, permite acesso (compatibilidade com versão anterior)
 */
export function optionalPermission(resource, action) {
    return async (c, next) => {
        const user = c.get("user");
        // Se não autenticado, permitir acesso (compatibilidade)
        if (!user) {
            await next();
            return;
        }
        // Se autenticado, verificar permissão
        const userRole = user.role;
        if (!rbac.can(userRole, resource, action)) {
            throw new AppError(`Acesso negado: você não tem permissão para ${action} em ${resource}`, "FORBIDDEN", 403);
        }
        await next();
    };
}
//# sourceMappingURL=optionalPermissionMiddleware.js.map