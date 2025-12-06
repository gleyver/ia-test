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
import dotenv from 'dotenv';
// Carregar variáveis de ambiente
dotenv.config();
// Importar app Hono centralizado (todas as rotas estão em src/app.ts)
import app from '../src/app.js';
// Configurar Azure Function HTTP Trigger
azureApp.http('httpTrigger', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    authLevel: 'anonymous',
    route: '{*proxy}',
    handler: async (request, context) => {
        try {
            // Converter Azure Function Request para Web API Request
            const url = new URL(request.url);
            const body = request.body ? await request.arrayBuffer() : null;
            const webRequest = new Request(url.toString(), {
                method: request.method,
                headers: request.headers,
                body: body,
            });
            // Executar app Hono
            const response = await app.fetch(webRequest);
            // Converter Web API Response para Azure Function Response
            const responseBody = await response.text();
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            return {
                status: response.status,
                headers: responseHeaders,
                body: responseBody,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            context.error(`Erro no handler: ${errorMessage}`);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: errorMessage }),
            };
        }
    },
});
//# sourceMappingURL=index.js.map