/**
 * Handlers para rotas de query
 * Separa lógica de processamento das rotas
 */
import { Context } from "hono";
import { Query } from "../../domain/valueObjects/query.js";
import { SessionId } from "../../domain/valueObjects/sessionId.js";
import type { FileLike } from "../../shared/types/types.js";
/**
 * Processa query com arquivo
 */
export declare function handleQueryWithFile(
  c: Context,
  query: Query,
  sessionId: SessionId,
  file: FileLike
): Promise<Response>;
/**
 * Processa query sem arquivo
 */
export declare function handleQueryWithoutFile(c: Context, query: Query): Promise<Response>;
/**
 * Trata erros de query
 */
export declare function handleQueryError(error: unknown): never;
//# sourceMappingURL=queryHandlers.d.ts.map
