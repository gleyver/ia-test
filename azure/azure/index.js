/**
 * Azure Functions entry point para Hono.js
 * Este arquivo é usado pelo Azure Functions para executar a aplicação Hono
 */
// Suprimir avisos de conflito entre canvas e sharp (inofensivo, mas verboso)
if (process.platform === 'darwin') {
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = function (chunk, encoding, cb) {
        const str = typeof chunk === 'string' ? chunk : chunk.toString();
        if (str.includes('GNotificationCenterDelegate') ||
            (str.includes('objc[') && str.includes('Class') && str.includes('implemented in both'))) {
            return true;
        }
        if (typeof encoding === 'function') {
            return originalWrite(chunk, encoding);
        }
        return originalWrite(chunk, encoding, cb);
    };
}
import { app as azureApp } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import dotenv from 'dotenv';
// Carregar variáveis de ambiente
dotenv.config();
// Importar app Hono centralizado (todas as rotas estão em src/app.ts)
import app from '../src/app.js';
// Configurar Azure Function HTTP Trigger usando adapter oficial do Hono
azureApp.http('httpTrigger', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    authLevel: 'anonymous',
    route: '{*proxy}',
    handler: azureHonoHandler(app.fetch),
});
//# sourceMappingURL=index.js.map