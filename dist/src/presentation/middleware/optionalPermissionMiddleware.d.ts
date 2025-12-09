/**
 * Middleware de permissão opcional
 * Verifica permissão apenas se usuário estiver autenticado
 */
import { Context, Next } from "hono";
/**
 * Middleware que verifica permissão apenas se usuário estiver autenticado
 * Se não autenticado, permite acesso (compatibilidade com versão anterior)
 */
export declare function optionalPermission(
  resource: string,
  action: string
): (c: Context, next: Next) => Promise<void>;
//# sourceMappingURL=optionalPermissionMiddleware.d.ts.map
