/**
 * Aplicação Hono centralizada
 * Contém todas as rotas e lógica do sistema RAG
 * Pode ser usada tanto no servidor Node.js quanto no Azure Functions
 */
import { Hono } from "hono";
declare const app: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=app.d.ts.map
