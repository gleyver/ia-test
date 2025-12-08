/**
 * Adapter para converter diferentes tipos de File para FileLike
 * Implementa Adapter Pattern
 */
/**
 * Adapter para converter File (Web API) ou FileLike para FileLike
 */
export class FileAdapter {
    /**
     * Converte File ou FileLike para FileLike
     */
    toFileLike(file) {
        if (this.isWebFile(file)) {
            return this.convertWebFile(file);
        }
        return file;
    }
    /**
     * Verifica se é File (Web API)
     */
    isWebFile(file) {
        return typeof File !== "undefined" && file instanceof File;
    }
    /**
     * Converte File (Web API) para FileLike
     */
    convertWebFile(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            arrayBuffer: () => file.arrayBuffer(),
        };
    }
}
//# sourceMappingURL=fileAdapter.js.map