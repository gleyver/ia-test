/**
 * Interface para armazenamento de arquivos
 */

/**
 * Interface para operações de armazenamento
 */
export interface IStorage {
  /**
   * Lê conteúdo de um arquivo
   */
  read(path: string): Promise<string>;

  /**
   * Escreve conteúdo em um arquivo
   */
  write(path: string, data: string): Promise<void>;

  /**
   * Verifica se um arquivo existe
   */
  exists(path: string): Promise<boolean>;
}
