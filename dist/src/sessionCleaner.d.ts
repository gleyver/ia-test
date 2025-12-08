/**
 * Limpeza automática de sessões antigas
 * Remove arquivos de sessão que não foram usados há mais de X minutos
 */
interface CleanupStats {
  sessionsChecked: number;
  sessionsDeleted: number;
  errors: number;
  totalSizeFreed: number;
}
export declare class SessionCleaner {
  private dbPath;
  private maxAgeMinutes;
  private intervalId;
  private isRunning;
  constructor({ dbPath, maxAgeMinutes }?: { dbPath?: string; maxAgeMinutes?: number });
  /**
   * Inicia limpeza automática periódica
   * @param intervalMinutes Intervalo entre limpezas (padrão: 30 minutos)
   */
  start(intervalMinutes?: number): void;
  /**
   * Para limpeza automática
   */
  stop(): void;
  /**
   * Executa limpeza de sessões antigas
   */
  cleanup(): Promise<CleanupStats>;
  /**
   * Limpa sessões manualmente (útil para testes)
   */
  cleanupNow(): Promise<CleanupStats>;
  /**
   * Retorna estatísticas sem executar limpeza
   */
  getStats(): Promise<{
    totalSessions: number;
    oldSessions: number;
    totalSize: number;
    oldSessionsSize: number;
  }>;
}
export {};
//# sourceMappingURL=sessionCleaner.d.ts.map
