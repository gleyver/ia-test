/**
 * Implementação de IStorage usando sistema de arquivos
 */

import { constants } from "fs";
import { access, readFile, writeFile } from "fs/promises";
import type { IStorage } from "./storage.interface.js";

/**
 * Armazenamento usando sistema de arquivos
 */
export class FileSystemStorage implements IStorage {
  async read(path: string): Promise<string> {
    return readFile(path, "utf-8");
  }

  async write(path: string, data: string): Promise<void> {
    return writeFile(path, data, "utf-8");
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
