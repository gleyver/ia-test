/**
 * Container de DI para testes
 * Permite criar containers isolados com mocks para cada teste
 */
import { Container } from "inversify";
import "reflect-metadata";
import { TYPES } from "../../shared/types/types.js";
/**
 * Cria um container de testes vazio
 * Use este container para injetar mocks específicos para cada teste
 */
export function createTestContainer() {
    return new Container();
}
/**
 * Cria um container de testes com mocks padrão
 * Útil para testes que não precisam de configuração específica
 */
export function createTestContainerWithMocks() {
    const container = createTestContainer();
    // Adicionar mocks padrão aqui se necessário
    // Exemplo:
    // container.bind<EmbeddingGenerator>(TYPES.EmbeddingGenerator).toConstantValue(createMockEmbeddingGenerator());
    return container;
}
/**
 * Aplica mocks ao container de testes
 */
export function bindMocks(container, mocks) {
    if (mocks.embeddingGenerator) {
        container
            .bind(TYPES.EmbeddingGenerator)
            .toConstantValue(mocks.embeddingGenerator);
    }
    if (mocks.responseGenerator) {
        container
            .bind(TYPES.ResponseGenerator)
            .toConstantValue(mocks.responseGenerator);
    }
    if (mocks.documentProcessor) {
        container
            .bind(TYPES.DocumentProcessor)
            .toConstantValue(mocks.documentProcessor);
    }
    if (mocks.vectorDbFactory) {
        container
            .bind(TYPES.VectorDBFactory)
            .toConstantValue(mocks.vectorDbFactory);
    }
    if (mocks.retrieverFactory) {
        container
            .bind(TYPES.RetrieverFactory)
            .toConstantValue(mocks.retrieverFactory);
    }
    if (mocks.textChunker) {
        container.bind(TYPES.TextChunker).toConstantValue(mocks.textChunker);
    }
}
//# sourceMappingURL=testContainer.js.map