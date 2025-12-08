/**
 * Implementação de IStorage usando sistema de arquivos
 */
import type { IStorage } from "./storage.interface.js";
/**
 * Armazenamento usando sistema de arquivos
 */
export declare class FileSystemStorage implements IStorage {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}
//# sourceMappingURL=fileSystemStorage.d.ts.map
