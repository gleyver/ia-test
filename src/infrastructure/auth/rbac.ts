/**
 * Role-Based Access Control (RBAC)
 * Define permissões baseadas em roles
 */

export enum Role {
  ADMIN = "admin",
  USER = "user",
  PREMIUM = "premium",
  GUEST = "guest",
}

export interface Permission {
  resource: string;
  action: string;
}

/**
 * Matriz de permissões por role
 */
const PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    { resource: "*", action: "*" }, // Admin tem acesso total
  ],
  [Role.PREMIUM]: [
    { resource: "query", action: "create" },
    { resource: "document", action: "upload" },
    { resource: "document", action: "delete" },
    { resource: "collection", action: "read" },
    { resource: "collection", action: "delete" },
  ],
  [Role.USER]: [
    { resource: "query", action: "create" },
    { resource: "document", action: "upload" },
    { resource: "collection", action: "read" },
  ],
  [Role.GUEST]: [
    { resource: "query", action: "create" },
    { resource: "collection", action: "read" },
  ],
};

export class RBAC {
  /**
   * Verifica se role tem permissão para ação
   */
  can(role: Role, resource: string, action: string): boolean {
    const rolePermissions = PERMISSIONS[role] || [];

    // Admin tem acesso total
    if (rolePermissions.some((p) => p.resource === "*" && p.action === "*")) {
      return true;
    }

    // Verificar permissão específica
    return rolePermissions.some(
      (p) =>
        (p.resource === resource || p.resource === "*") && (p.action === action || p.action === "*")
    );
  }

  /**
   * Verifica se pode fazer upload de arquivo
   */
  canUploadFile(role: Role): boolean {
    return this.can(role, "document", "upload");
  }

  /**
   * Verifica se pode deletar coleção
   */
  canDeleteCollection(role: Role): boolean {
    return this.can(role, "collection", "delete");
  }

  /**
   * Verifica se pode fazer query
   */
  canQuery(role: Role): boolean {
    return this.can(role, "query", "create");
  }

  /**
   * Verifica se pode deletar documento
   */
  canDeleteDocument(role: Role): boolean {
    return this.can(role, "document", "delete");
  }

  /**
   * Obtém todas as permissões de uma role
   */
  getPermissions(role: Role): Permission[] {
    return PERMISSIONS[role] || [];
  }
}
