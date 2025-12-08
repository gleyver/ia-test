/**
 * Serviço de processamento de queries
 * Isola lógica de negócio das rotas
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { ExecuteQueryUseCase } from "../domain/useCases/executeQueryUseCase.js";
import { Query } from "../domain/valueObjects/query.js";
import { queriesProcessed, queryProcessingDuration, } from "../metrics/index.js";
import { ProcessingError } from "../shared/errors/errors.js";
import { logger } from "../shared/logging/logger.js";
import { TYPES } from "../shared/types/types.js";
let QueryService = class QueryService {
    executeQueryUseCase;
    constructor(createRetriever, responseGenerator) {
        // Criar Use Case com dependências injetadas
        this.executeQueryUseCase = new ExecuteQueryUseCase(createRetriever, responseGenerator);
    }
    async executeQuery(query, vectorDb, hasFile) {
        const startTime = Date.now();
        try {
            // Criar Query Value Object
            const queryVO = Query.fromString(query);
            // Executar Use Case
            const result = await this.executeQueryUseCase.execute({
                query: queryVO,
                vectorDb,
                hasFile,
            });
            const duration = (Date.now() - startTime) / 1000;
            queryProcessingDuration.observe({ has_file: hasFile ? "true" : "false" }, duration);
            queriesProcessed.inc({ has_file: hasFile ? "true" : "false" });
            logger.info({ queryLength: query.length, sourcesCount: result.sources.length, duration }, `Query processada ${hasFile ? "com" : "sem"} arquivo`);
            return {
                response: result.response,
                sources: result.sources.map((s) => s.text),
                metadata: {
                    model: "llama3.2",
                    numSources: result.metadata.sourcesCount,
                },
            };
        }
        catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            queriesProcessed.inc({ has_file: hasFile ? "true" : "false" });
            if (error instanceof ProcessingError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ error: errorMessage, hasFile, duration }, "Erro ao processar query");
            throw new ProcessingError("Erro ao processar query", { originalError: errorMessage });
        }
    }
};
QueryService = __decorate([
    injectable(),
    __param(0, inject(TYPES.RetrieverFactory)),
    __param(1, inject(TYPES.ResponseGenerator)),
    __metadata("design:paramtypes", [Function, Object])
], QueryService);
export { QueryService };
//# sourceMappingURL=queryService.js.map