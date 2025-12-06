/**
 * Servidor RAG usando Hono.js
 * Execute: npm install && npm start
 *
 * Nota: O aviso sobre GNotificationCenterDelegate é inofensivo e ocorre porque
 * tanto canvas quanto sharp (dependência de @xenova/transformers) carregam
 * bibliotecas nativas com classes duplicadas. Isso não afeta a funcionalidade.
 */
// Suprimir avisos de conflito entre canvas e sharp (inofensivo, mas verboso)
// O sharp é uma dependência do @xenova/transformers e o aviso é emitido pelo runtime Objective-C
if (process.platform === 'darwin') {
    // Interceptar stderr para filtrar avisos específicos do Objective-C
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = function (chunk, encoding, cb) {
        const str = typeof chunk === 'string' ? chunk : chunk.toString();
        // Filtrar avisos sobre GNotificationCenterDelegate e objc
        if (str.includes('GNotificationCenterDelegate') ||
            (str.includes('objc[') && str.includes('Class') && str.includes('implemented in both'))) {
            return true; // Suprimir esse aviso específico
        }
        if (typeof encoding === 'function') {
            return originalWrite(chunk, encoding);
        }
        return originalWrite(chunk, encoding, cb);
    };
}
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
// Carregar variáveis de ambiente
dotenv.config();
// Importar app Hono centralizado (todas as rotas estão lá)
import app from './src/app.js';
// Iniciar servidor
const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Servidor RAG rodando em http://localhost:${port}`);
serve({
    fetch: app.fetch,
    port
});
//# sourceMappingURL=server.js.map