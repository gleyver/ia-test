/**
 * Limpeza automática de sessões antigas
 * Remove arquivos de sessão que não foram usados há mais de X minutos
 */
import { readdir, stat, unlink } from "fs";
import { access, constants } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);
const unlinkAsync = promisify(unlink);
export class SessionCleaner {
    dbPath;
    maxAgeMinutes;
    intervalId = null;
    isRunning = false;
    constructor({ dbPath = "./vector_db", maxAgeMinutes = 60, // 1 hora por padrão
     } = {}) {
        this.dbPath = dbPath;
        this.maxAgeMinutes = maxAgeMinutes;
    }
    /**
     * Inicia limpeza automática periódica
     * @param intervalMinutes Intervalo entre limpezas (padrão: 30 minutos)
     */
    start(intervalMinutes = 30) {
        if (this.intervalId) {
            console.log("⚠️  Limpeza automática já está rodando");
            return;
        }
        console.log(`🧹 Iniciando limpeza automática de sessões (intervalo: ${intervalMinutes}min, idade máxima: ${this.maxAgeMinutes}min)`);
        // Executar limpeza imediatamente
        this.cleanup().catch((error) => {
            console.error("Erro na limpeza inicial:", error);
        });
        // Agendar limpeza periódica
        this.intervalId = setInterval(() => {
            this.cleanup().catch((error) => {
                console.error("Erro na limpeza periódica:", error);
            });
        }, intervalMinutes * 60 * 1000);
    }
    /**
     * Para limpeza automática
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log("🛑 Limpeza automática parada");
        }
    }
    /**
     * Executa limpeza de sessões antigas
     */
    async cleanup() {
        if (this.isRunning) {
            console.log("⏳ Limpeza já está em execução, pulando...");
            return {
                sessionsChecked: 0,
                sessionsDeleted: 0,
                errors: 0,
                totalSizeFreed: 0,
            };
        }
        this.isRunning = true;
        const stats = {
            sessionsChecked: 0,
            sessionsDeleted: 0,
            errors: 0,
            totalSizeFreed: 0,
        };
        try {
            // Verificar se diretório existe (assíncrono)
            try {
                await access(this.dbPath, constants.F_OK);
            }
            catch {
                console.log(`📂 Diretório ${this.dbPath} não existe, nada para limpar`);
                return stats;
            }
            // Listar todos os arquivos no diretório
            const files = await readdirAsync(this.dbPath);
            const sessionFiles = files.filter((file) => file.startsWith("session-") && file.endsWith(".json"));
            stats.sessionsChecked = sessionFiles.length;
            if (sessionFiles.length === 0) {
                console.log("✨ Nenhuma sessão para limpar");
                return stats;
            }
            console.log(`🔍 Verificando ${sessionFiles.length} sessões...`);
            const now = Date.now();
            const maxAgeMs = this.maxAgeMinutes * 60 * 1000;
            // Verificar cada arquivo de sessão
            for (const file of sessionFiles) {
                try {
                    const filePath = join(this.dbPath, file);
                    const fileStats = await statAsync(filePath);
                    const fileAge = now - fileStats.mtimeMs;
                    // Se arquivo é mais antigo que maxAgeMinutes, deletar
                    if (fileAge > maxAgeMs) {
                        const fileSize = fileStats.size;
                        await unlinkAsync(filePath);
                        stats.sessionsDeleted++;
                        stats.totalSizeFreed += fileSize;
                        console.log(`🗑️  Sessão removida: ${file} (idade: ${Math.floor(fileAge / 60000)}min, tamanho: ${(fileSize / 1024).toFixed(2)}KB)`);
                    }
                }
                catch (error) {
                    stats.errors++;
                    console.error(`❌ Erro ao processar ${file}:`, error);
                }
            }
            // Log resumo
            if (stats.sessionsDeleted > 0) {
                console.log(`✅ Limpeza concluída: ${stats.sessionsDeleted}/${stats.sessionsChecked} sessões removidas, ${(stats.totalSizeFreed / 1024 / 1024).toFixed(2)}MB liberados`);
            }
            else {
                console.log(`✨ Nenhuma sessão antiga encontrada (todas são mais recentes que ${this.maxAgeMinutes}min)`);
            }
        }
        catch (error) {
            console.error("❌ Erro durante limpeza:", error);
            stats.errors++;
        }
        finally {
            this.isRunning = false;
        }
        return stats;
    }
    /**
     * Limpa sessões manualmente (útil para testes)
     */
    async cleanupNow() {
        return this.cleanup();
    }
    /**
     * Retorna estatísticas sem executar limpeza
     */
    async getStats() {
        try {
            await access(this.dbPath, constants.F_OK);
        }
        catch {
            return {
                totalSessions: 0,
                oldSessions: 0,
                totalSize: 0,
                oldSessionsSize: 0,
            };
        }
        const files = await readdirAsync(this.dbPath);
        const sessionFiles = files.filter((file) => file.startsWith("session-") && file.endsWith(".json"));
        const now = Date.now();
        const maxAgeMs = this.maxAgeMinutes * 60 * 1000;
        let totalSize = 0;
        let oldSessions = 0;
        let oldSessionsSize = 0;
        for (const file of sessionFiles) {
            try {
                const filePath = join(this.dbPath, file);
                const fileStats = await statAsync(filePath);
                totalSize += fileStats.size;
                const fileAge = now - fileStats.mtimeMs;
                if (fileAge > maxAgeMs) {
                    oldSessions++;
                    oldSessionsSize += fileStats.size;
                }
            }
            catch {
                // Ignorar erros ao ler stats
            }
        }
        return {
            totalSessions: sessionFiles.length,
            oldSessions,
            totalSize,
            oldSessionsSize,
        };
    }
}
//# sourceMappingURL=sessionCleaner.js.map