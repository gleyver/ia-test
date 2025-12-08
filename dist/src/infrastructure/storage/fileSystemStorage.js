/**
 * Implementação de IStorage usando sistema de arquivos
 */
import { constants } from "fs";
import { access, readFile, writeFile } from "fs/promises";
/**
 * Armazenamento usando sistema de arquivos
 */
export class FileSystemStorage {
    async read(path) {
        return readFile(path, "utf-8");
    }
    async write(path, data) {
        return writeFile(path, data, "utf-8");
    }
    async exists(path) {
        try {
            await access(path, constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=fileSystemStorage.js.map