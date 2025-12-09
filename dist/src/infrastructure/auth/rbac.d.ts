/**
 * Role-Based Access Control (RBAC)
 * Define permissões baseadas em roles
 */
export declare enum Role {
  ADMIN = "admin",
  USER = "user",
  PREMIUM = "premium",
  GUEST = "guest",
}
export interface Permission {
  resource: string;
  action: string;
}
export declare class RBAC {
  /**
   * Verifica se role tem permissão para ação
   */
  can(role: Role, resource: string, action: string): boolean;
  /**
   * Verifica se pode fazer upload de arquivo
   */
  canUploadFile(role: Role): boolean;
  /**
   * Verifica se pode deletar coleção
   */
  canDeleteCollection(role: Role): boolean;
  /**
   * Verifica se pode fazer query
   */
  canQuery(role: Role): boolean;
  /**
   * Verifica se pode deletar documento
   */
  canDeleteDocument(role: Role): boolean;
  /**
   * Obtém todas as permissões de uma role
   */
  getPermissions(role: Role): Permission[];
}
//# sourceMappingURL=rbac.d.ts.map
