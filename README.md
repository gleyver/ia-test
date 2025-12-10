# 🚀 Sistema RAG - Node.js + Hono.js

Sistema completo de **RAG (Retrieval-Augmented Generation)** implementado em Node.js usando Hono.js. Processa documentos, gera embeddings, indexa em vector database e responde perguntas usando LLM local (Ollama).

## 📋 O que o projeto faz?

Este sistema permite:

- ✅ **Processar documentos** (PDF, DOCX, HTML, TXT) com suporte a OCR para PDFs escaneados
- ✅ **Extrair e dividir texto** em chunks inteligentes com overlap
- ✅ **Gerar embeddings** usando modelos locais (@xenova/transformers)
- ✅ **Indexar documentos** em vector database customizada (JSON-based)
- ✅ **Buscar documentos relevantes** usando similarity search
- ✅ **Gerar respostas** usando LLM local (Ollama)
- ✅ **API RESTful** para integração
- ✅ **Deploy no Azure Functions** (serverless)

## 🎯 Tecnologias Utilizadas

- **Hono.js**: Framework web rápido e leve
- **@xenova/transformers**: Embeddings locais (sem necessidade de API externa)
- **Ollama**: LLM local (gratuito)
- **Tesseract.js**: OCR para PDFs escaneados
- **TypeScript**: Tipagem estrita
- **Inversify**: Dependency Injection
- **Redis**: Cache distribuído e rate limiting
- **Prometheus**: Métricas e monitoramento
- **Pino**: Logging estruturado
- **Zod**: Validação de configuração
- **Husky**: Git hooks para validação automática
- **K6**: Testes de carga e performance
- **JWT (jsonwebtoken)**: Autenticação e autorização
- **hnswlib-node**: Índice HNSW para busca vetorial otimizada
- **GitHub Actions**: CI/CD automatizado

## 📦 Como Baixar e Instalar

### 1. Pré-requisitos

**Opção A: Usar Docker (Recomendado - Mais fácil)**

- **Docker** instalado
- **Docker Compose** instalado
- **Git** (opcional, para versionamento)

**Opção B: Instalação Local**

- **Node.js** 20+ instalado
- **Ollama** instalado e rodando
- **Git** (opcional, para versionamento)

### 2. Clonar/Baixar o projeto

```bash
# Se usar Git
git clone <seu-repositorio>
cd IA

# Ou baixe e extraia o projeto
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Instalar e configurar Ollama

> **💡 Dica:** Se você vai usar Docker (veja seção "🚀 Como Rodar - Opção 1"), pode pular esta etapa! O Docker já inclui o Ollama.

**macOS:**

```bash
brew install ollama
```

**Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Baixe de: https://ollama.ai/download

### 5. Baixar modelo LLM

```bash
ollama pull llama3.2
```

### 6. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Autenticação JWT (obrigatório em produção)
JWT_SECRET=seu-secret-super-seguro-com-pelo-menos-32-caracteres

# CORS (opcional)
ALLOWED_ORIGINS=http://localhost:3000,https://seu-dominio.com

# Redis (opcional)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

> ⚠️ **IMPORTANTE:** Em produção, `JWT_SECRET` é obrigatório e deve ter pelo menos 32 caracteres. O sistema valida automaticamente no startup.

## 🚀 Como Rodar

### Opção 1: Docker (Recomendado - Não precisa instalar Ollama localmente) 🐳

Se você **não tem o Ollama instalado** na sua máquina, use Docker! É a forma mais fácil de começar:

#### Pré-requisitos:

- **Docker** instalado
- **Docker Compose** instalado

#### Passos:

1. **Baixar modelo LLM (primeira vez apenas):**

   ```bash
   # Iniciar apenas o Ollama primeiro
   docker-compose up -d ollama

   # Aguardar Ollama iniciar (30 segundos)
   sleep 30

   # Baixar modelo
   docker exec -it ia-ollama-1 ollama pull llama3.2
   ```

2. **Iniciar todos os serviços:**

   ```bash
   docker-compose up -d
   ```

3. **Verificar se está rodando:**

   ```bash
   # Ver logs
   docker-compose logs -f

   # Ou testar a API
   curl http://localhost:3000/api/health
   ```

4. **Parar serviços:**

   ```bash
   docker-compose down
   ```

**Vantagens:**

- ✅ Não precisa instalar Ollama na sua máquina
- ✅ Não precisa instalar Node.js (se não quiser)
- ✅ Isolamento completo de dependências
- ✅ Fácil de limpar e recomeçar

**O servidor estará disponível em:** `http://localhost:3000`

> ⚠️ **Atenção:** Se você já tiver o servidor rodando localmente (Opção 2) na porta 3000, pare-o antes de iniciar o Docker, ou mude a porta no `docker-compose.yml` (ex: `"3001:3000"`).
>
> **Nota sobre portas:**
>
> - **Porta 3000/3001**: API RAG (servidor principal)
> - **Porta 11434**: Ollama (sempre essa porta, não muda)
> - Dentro do Docker, os containers se comunicam automaticamente via `http://ollama:11434` (não precisa ajustar nada)

---

### Opção 2: Localmente (requer Ollama instalado)

Se você já tem o Ollama instalado na sua máquina:

#### Desenvolvimento (com auto-reload):

```bash
npm run dev
```

#### Produção:

```bash
npm start
```

#### Ou compilar e rodar:

```bash
npm run build
node dist/server.js
```

**O servidor estará disponível em:** `http://localhost:3000`

> ⚠️ **Atenção:** Se você tiver o Docker rodando na porta 3000, pare-o antes (`docker-compose down`) ou mude a porta no `.env` (ex: `PORT=3001`).

**Nota:** Para esta opção, você precisa ter o Ollama instalado e rodando. Veja a seção "📦 Como Baixar e Instalar" acima para instruções de instalação do Ollama.

## 🔐 Autenticação

A API suporta autenticação JWT opcional. Para usar:

1. **Fazer login:**

   ```bash
   POST /api/auth/login
   Body: { "userId": "user123", "role": "premium", "email": "user@example.com" }
   ```

2. **Usar token nas requisições:**

   ```bash
   Authorization: Bearer <token>
   ```

3. **Verificar token:**
   ```bash
   POST /api/auth/verify
   Body: { "token": "<seu-token>" }
   ```

**Roles disponíveis:**

- `admin` - Acesso total
- `premium` - Upload, query, delete
- `user` - Upload, query
- `guest` - Query apenas

**Nota:** A autenticação é opcional por padrão (compatibilidade retroativa). Endpoints funcionam sem token.

## 📡 API Endpoints

### `POST /api/auth/login`

Gera token JWT para autenticação.

**Body (JSON):**

```json
{
  "userId": "user123",
  "role": "premium",
  "email": "user@example.com"
}
```

**Resposta:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "userId": "user123",
    "role": "premium",
    "email": "user@example.com"
  }
}
```

### `POST /api/auth/verify`

Verifica se um token JWT é válido.

**Body (JSON):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (válido):**

```json
{
  "valid": true,
  "user": {
    "userId": "user123",
    "role": "premium",
    "email": "user@example.com"
  }
}
```

**Resposta (inválido):**

```json
{
  "valid": false,
  "error": "Token expirado"
}
```

### `GET /api/health`

Health check do sistema com status de dependências.

**Resposta:**

```json
{
  "status": "ok",
  "timestamp": "2024-12-08T15:00:00.000Z",
  "uptime": 3600,
  "dependencies": {
    "ollama": { "status": "ok" },
    "vectorDb": { "status": "ok" },
    "redis": { "status": "ok", "message": "Redis desabilitado (usando memória)" },
    "circuitBreaker": {
      "state": "CLOSED",
      "stats": {
        "failures": 0,
        "successes": 10,
        "lastFailureTime": null,
        "state": "CLOSED"
      }
    }
  },
  "memory": { ... }
}
```

### `POST /api/query`

Upload de documento + query em uma única chamada.

**Headers (opcional):**

```
Authorization: Bearer <token>
```

**Form Data (multipart/form-data):**

- `file`: Arquivo (PDF, DOCX, TXT, HTML) - opcional
- `query`: Pergunta/consulta - obrigatório

**JSON (application/json):**

```json
{
  "query": "Qual é o conteúdo do documento?"
}
```

**Permissões:**

- Se autenticado: requer permissão `query:create`
- Sem autenticação: funciona normalmente

**Resposta:**

```json
{
  "success": true,
  "response": "Resposta gerada pelo LLM...",
  "sources": ["documento.pdf"],
  "metadata": {
    "model": "llama3.2",
    "numSources": 1
  },
  "fileProcessed": "documento.pdf"
}
```

### `POST /api/documents/upload`

Upload e processa documento (sem query).

**Headers (opcional):**

```
Authorization: Bearer <token>
```

**Form Data:**

- `file`: Arquivo (PDF, DOCX, TXT, HTML)

**Permissões:**

- Se autenticado: requer permissão `document:upload`
- Sem autenticação: funciona normalmente

**Resposta:**

```json
{
  "success": true,
  "filename": "documento.pdf",
  "chunksCreated": 10,
  "metadata": { ... }
}
```

### `GET /api/collection/info`

Informações sobre a coleção de documentos indexados.

**Resposta:**

```json
{
  "totalDocuments": 10,
  "totalChunks": 150
}
```

### `DELETE /api/collection`

Limpa manualmente todas as sessões expiradas.

**Headers (opcional):**

```
Authorization: Bearer <token>
```

**Permissões:**

- Se autenticado: requer permissão `collection:delete` (admin ou premium)
- Sem autenticação: funciona normalmente

**Resposta:**

```json
{
  "success": true,
  "message": "Limpeza manual executada.",
  "stats": {
    "sessionsChecked": 10,
    "sessionsDeleted": 5,
    "sizeFreedMB": "2.45",
    "errors": []
  }
}
```

### `POST /api/circuit-breaker/reset`

Reseta o Circuit Breaker (útil quando está aberto).

**Resposta:**

```json
{
  "success": true,
  "message": "Circuit Breaker resetado com sucesso",
  "state": "CLOSED"
}
```

## 🏗️ Arquitetura

O projeto segue **Clean Architecture** com separação clara de responsabilidades e aplicação de princípios SOLID, Design Patterns e boas práticas de desenvolvimento.

### Camadas da Arquitetura

1. **Domain (Domínio)** - Regras de negócio puras
   - Independente de frameworks e bibliotecas externas
   - Contém: Entidades, Interfaces, Value Objects, Use Cases, Serviços de Domínio

2. **Infrastructure (Infraestrutura)** - Implementações concretas
   - Integrações com serviços externos (Ollama, Redis, etc.)
   - Detalhes técnicos (OCR, processamento de arquivos, etc.)
   - Implementa interfaces definidas no domínio

3. **Presentation (Apresentação)** - Interface HTTP
   - Rotas e endpoints da API
   - Parsers e Adapters para requisições
   - Orquestração de fluxos de requisição

4. **Services (Serviços)** - Orquestração
   - Coordenam múltiplas operações
   - Utilizam casos de uso do domínio

### Princípios e Padrões Aplicados

- ✅ **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- ✅ **Design Patterns**: Strategy, Repository, Factory, Adapter, Decorator, Circuit Breaker, Singleton
- ✅ **Dependency Injection**: Inversify para gerenciamento de dependências
- ✅ **Value Objects**: Imutabilidade e validação (DocumentId, SessionId, Query, FileSize)
- ✅ **Use Cases**: Encapsulamento de lógica de negócio
- ✅ **Clean Architecture**: Separação de responsabilidades por camadas

## 📁 Estrutura do Projeto

O projeto segue **Clean Architecture** com separação clara de responsabilidades:

```
IA/
├── src/
│   ├── domain/                    # Camada de Domínio (regras de negócio)
│   │   ├── entities/              # Entidades de domínio
│   │   │   └── chunker.ts         # Divisão de texto em chunks
│   │   ├── interfaces/            # Contratos (interfaces)
│   │   │   ├── documentProcessor.interface.ts
│   │   │   ├── embeddingGenerator.interface.ts
│   │   │   ├── responseGenerator.interface.ts
│   │   │   ├── retriever.interface.ts
│   │   │   ├── textChunker.interface.ts
│   │   │   ├── vectorSearch.interface.ts
│   │   │   └── documentRepository.interface.ts
│   │   ├── services/              # Serviços de domínio
│   │   │   └── retriever.ts       # Busca de documentos relevantes
│   │   ├── useCases/               # Casos de uso (lógica de negócio)
│   │   │   ├── processDocumentUseCase.ts
│   │   │   └── executeQueryUseCase.ts
│   │   ├── valueObjects/           # Value Objects (imutáveis)
│   │   │   ├── documentId.ts
│   │   │   ├── sessionId.ts
│   │   │   ├── fileSize.ts
│   │   │   └── query.ts
│   │   └── validators.ts          # Validações de domínio
│   │
│   ├── infrastructure/            # Camada de Infraestrutura (implementações)
│   │   ├── circuitBreaker/        # Circuit Breaker pattern
│   │   ├── container.ts           # Inversify DI Container
│   │   ├── embeddings.ts          # Geração de embeddings (@xenova/transformers)
│   │   ├── llm/                   # LLM (Ollama)
│   │   │   ├── generator.ts       # Geração de respostas
│   │   │   ├── requestQueue.ts    # Fila de requisições
│   │   │   ├── responseCache.ts   # Cache de respostas
│   │   │   └── retryStrategy.ts   # Estratégia de retry
│   │   ├── ocr/                   # OCR (Tesseract.js)
│   │   │   ├── ocrService.interface.ts
│   │   │   └── tesseractOCRService.ts
│   │   ├── processors/            # Processadores de documentos
│   │   │   ├── documentProcessor.ts
│   │   │   ├── pdfProcessor.ts
│   │   │   ├── pdfProcessorWithOCR.ts
│   │   │   ├── docxProcessor.ts
│   │   │   ├── textProcessor.ts
│   │   │   └── processorRegistry.ts
│   │   ├── search/                # Busca vetorial
│   │   │   └── vectorSearch.ts
│   │   ├── sessionManagement/    # Gerenciamento de sessões
│   │   │   └── sessionCleaner.ts
│   │   └── storage/               # Persistência
│   │       ├── vectorDb.ts        # Vector database
│   │       ├── jsonDocumentRepository.ts
│   │       ├── fileSystemStorage.ts
│   │       └── storage.interface.ts
│   │
│   ├── presentation/              # Camada de Apresentação (API/HTTP)
│   │   ├── app.ts                # Aplicação Hono (rotas)
│   │   ├── adapters/             # Adapters
│   │   │   └── fileAdapter.ts
│   │   └── parsers/              # Parsers
│   │       └── formDataParser.ts
│   │
│   ├── services/                 # Services (orquestração)
│   │   ├── documentService.ts
│   │   └── queryService.ts
│   │
│   ├── shared/                   # Código compartilhado
│   │   ├── errors/               # Erros customizados
│   │   ├── logging/              # Logger (Pino)
│   │   ├── types/                # Tipos TypeScript compartilhados
│   │   └── utils/                # Funções utilitárias
│   │
│   ├── cache/                    # Cache distribuído (Redis)
│   │   └── distributed.ts
│   ├── config/                   # Configuração centralizada
│   │   └── index.ts
│   ├── metrics/                  # Métricas Prometheus
│   │   └── index.ts
│   ├── rateLimiter/              # Rate Limiter distribuído
│   │   └── distributed.ts
│   └── redis/                    # Cliente Redis
│       └── client.ts
│
├── azure/                       # Configuração Azure Functions
│   ├── index.ts
│   ├── function.json
│   ├── host.json
│   └── package.json
│
├── k6-tests/                    # Testes de carga (K6)
│   ├── basic-test.js
│   ├── load-test.js
│   ├── stress-test.js
│   ├── spike-test.js
│   └── full-test.js
│
├── dist/                        # Arquivos compilados (gerado automaticamente)
├── vector_db/                   # Vector database (JSON files)
│
├── server.ts                    # Servidor Node.js
├── package.json                 # Dependências e scripts
├── tsconfig.json                # Configuração TypeScript
├── vitest.config.ts             # Configuração Vitest
├── eslint.config.js             # Configuração ESLint
├── .prettierrc.json             # Configuração Prettier
├── .commitlintrc.json           # Configuração Conventional Commits
├── .cz-config.cjs               # Configuração Commitizen
├── cz-adapter.cjs               # Adapter Commitizen
├── .husky/                      # Git hooks
│   ├── pre-commit
│   └── commit-msg
├── test-simple.sh              # Script de testes simples
├── test-load.sh                # Script de teste de carga
└── README.md                    # Este arquivo
```

## 🏗️ Arquitetura

O projeto segue **Clean Architecture** com as seguintes camadas:

### Camadas

1. **Domain (Domínio)**
   - Contém regras de negócio puras
   - Independente de frameworks e bibliotecas externas
   - Inclui: Entidades, Interfaces, Value Objects, Use Cases

2. **Infrastructure (Infraestrutura)**
   - Implementações concretas de interfaces do domínio
   - Integrações com serviços externos (Ollama, Redis, etc.)
   - Detalhes técnicos (OCR, processamento de arquivos, etc.)

3. **Presentation (Apresentação)**
   - Interface HTTP (Hono.js)
   - Parsers e Adapters para requisições
   - Orquestração de fluxos

4. **Services (Serviços)**
   - Orquestram casos de uso
   - Coordenam múltiplas operações

### Princípios Aplicados

- ✅ **SOLID**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- ✅ **Design Patterns**: Strategy, Repository, Factory, Adapter, Decorator, Circuit Breaker
- ✅ **Dependency Injection**: Inversify para gerenciamento de dependências
- ✅ **Value Objects**: Imutabilidade e validação (DocumentId, SessionId, Query, FileSize)
- ✅ **Use Cases**: Encapsulamento de lógica de negócio

## 📄 Descrição dos Arquivos Principais

### Domain (Domínio)

- **`domain/entities/chunker.ts`**: Divisão de texto em chunks (padrão: 1000 tokens, overlap 200)
- **`domain/services/retriever.ts`**: Sistema de recuperação de documentos relevantes
- **`domain/useCases/`**: Casos de uso que encapsulam lógica de negócio
- **`domain/valueObjects/`**: Value Objects imutáveis (DocumentId, SessionId, Query, FileSize)
- **`domain/interfaces/`**: Contratos (interfaces) para inversão de dependência

### Infrastructure (Infraestrutura)

- **`infrastructure/embeddings.ts`**: Geração de embeddings usando `@xenova/transformers` (modelo: `Xenova/all-MiniLM-L6-v2`)
- **`infrastructure/llm/generator.ts`**: Geração de respostas usando Ollama (modelo: `llama3.2`)
- **`infrastructure/storage/vectorDb.ts`**: Vector database customizada (JSON) com busca por similaridade
- **`infrastructure/processors/`**: Processamento de PDF, DOCX, HTML, TXT com OCR automático
- **`infrastructure/ocr/`**: Serviço de OCR usando Tesseract.js
- **`infrastructure/circuitBreaker/`**: Circuit Breaker para proteção contra falhas em cascata

### Presentation (Apresentação)

- **`presentation/app.ts`**: Aplicação Hono centralizada com todas as rotas da API
- **`presentation/parsers/formDataParser.ts`**: Parser de form-data (multipart e JSON)
- **`presentation/adapters/fileAdapter.ts`**: Adapter para diferentes tipos de File

### Services (Serviços)

- **`services/documentService.ts`**: Orquestra processamento e indexação de documentos
- **`services/queryService.ts`**: Orquestra execução de queries

### Shared (Compartilhado)

- **`shared/types/types.ts`**: Tipos TypeScript compartilhados
- **`shared/utils/utils.ts`**: Funções utilitárias (cosine similarity, etc.)
- **`shared/errors/errors.ts`**: Erros customizados
- **`shared/logging/logger.ts`**: Logger estruturado (Pino)

### Arquivos Principais

- **`server.ts`**: Servidor Node.js para desenvolvimento local
- **`azure/index.ts`**: Entry point para Azure Functions
- **`package.json`**: Dependências e scripts npm
- **`config/index.ts`**: Configuração centralizada com validação (Zod)

## 🐕 Git Hooks (Husky)

O projeto usa **Husky** para validar código e commits automaticamente.

### Hooks Configurados

- **`.husky/pre-commit`**: Valida lint e build antes do commit
- **`.husky/commit-msg`**: Valida formato Conventional Commits

### Como Fazer Commits

**Opção 1: Interface Interativa (Recomendado)**

```bash
npm run commit
# ou
git commit
```

O sistema oferece sugestões automáticas baseadas nos arquivos modificados.

**Opção 2: Manual**

```bash
git commit -m "tipo(escopo): descrição"
```

**Formatos válidos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Exemplos:**

- ✅ `feat: adiciona suporte a Azure Functions`
- ✅ `fix(api): corrige erro de parsing`
- ❌ `adiciona funcionalidade` (sem tipo)

## 🚀 Deploy em Produção

Existem várias opções para rodar o sistema em produção. Escolha a que melhor se adequa ao seu caso:

### Opção 1: Servidor Próprio (VPS/Cloud)

#### O que você precisa instalar na máquina:

1. **Node.js 20+**

   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # macOS (já deve ter se instalou via Homebrew)
   brew install node@20
   ```

2. **Ollama**

   ```bash
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh

   # macOS
   brew install ollama
   ```

3. **Dependências do sistema (para OCR e PDF)**

   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y \
     build-essential \
     python3 \
     cairo-dev \
     jpeg-dev \
     pango-dev \
     graphicsmagick \
     imagemagick

   # macOS
   brew install graphicsmagick imagemagick
   ```

#### Passos para Deploy:

1. **Clonar/Baixar o projeto na máquina:**

   ```bash
   git clone <seu-repositorio>
   cd IA
   ```

2. **Instalar dependências:**

   ```bash
   npm install
   ```

3. **Baixar modelo LLM:**

   ```bash
   ollama pull llama3.2
   ```

4. **Configurar variáveis de ambiente:**

   ```bash
   # Criar arquivo .env
   cat > .env << EOF
   NODE_ENV=production
   PORT=3000
   OLLAMA_URL=http://localhost:11434
   EOF
   ```

5. **Compilar o projeto:**

   ```bash
   npm run build
   ```

6. **Iniciar Ollama (se não estiver rodando):**

   ```bash
   ollama serve
   # Ou como serviço systemd (veja abaixo)
   ```

7. **Iniciar a aplicação:**

   ```bash
   # Opção 1: Direto (não recomendado para produção)
   npm start

   # Opção 2: Com PM2 (recomendado)
   npm install -g pm2
   pm2 start dist/server.js --name rag-system
   pm2 save
   pm2 startup  # Configurar para iniciar no boot
   ```

#### Configurar Ollama como Serviço (Linux):

Crie `/etc/systemd/system/ollama.service`:

```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=seu-usuario
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

#### Configurar Aplicação como Serviço (Linux):

Crie `/etc/systemd/system/rag-system.service`:

```ini
[Unit]
Description=RAG System API
After=network.target ollama.service
Requires=ollama.service

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/IA
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="OLLAMA_URL=http://localhost:11434"
ExecStart=/usr/bin/node /caminho/para/IA/dist/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl enable rag-system
sudo systemctl start rag-system
sudo systemctl status rag-system  # Verificar status
```

#### Configurar Nginx como Reverse Proxy (Opcional):

Crie `/etc/nginx/sites-available/rag-system`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/rag-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Opção 2: Docker (Recomendado)

#### Pré-requisitos:

- **Docker** instalado
- **Docker Compose** instalado

#### Passos:

1. **Clonar o projeto:**

   ```bash
   git clone <seu-repositorio>
   cd IA
   ```

2. **Baixar modelo LLM (antes de iniciar):**

   ```bash
   # Iniciar apenas o Ollama primeiro
   docker-compose up -d ollama

   # Aguardar Ollama iniciar (30 segundos)
   sleep 30

   # Baixar modelo
   docker exec -it ia-ollama-1 ollama pull llama3.2
   ```

3. **Iniciar todos os serviços:**

   ```bash
   docker-compose up -d
   ```

4. **Verificar logs:**

   ```bash
   docker-compose logs -f
   ```

5. **Parar serviços:**
   ```bash
   docker-compose down
   ```

#### Vantagens do Docker:

- ✅ Isolamento de dependências
- ✅ Fácil de atualizar
- ✅ Portável entre ambientes
- ✅ Gerenciamento automático de serviços
- ✅ Volumes persistentes para dados

#### Configurar Docker para iniciar no boot:

```bash
# Criar arquivo docker-compose.service
sudo nano /etc/systemd/system/docker-compose-rag.service
```

Conteúdo:

```ini
[Unit]
Description=RAG System Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/caminho/para/IA
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl enable docker-compose-rag
sudo systemctl start docker-compose-rag
```

### Opção 3: Azure Functions (Serverless)

#### Pré-requisitos:

1. **Azure CLI** instalado
2. **Azure Functions Core Tools** instalado
3. Conta Azure com subscription ativa

#### Limitações:

⚠️ **IMPORTANTE**: Azure Functions tem limitações:

- Timeout máximo: 10 minutos (configurado em `azure/host.json`)
- Memória limitada
- Ollama precisa estar em outro serviço (Azure VM, Container Instance, etc.)
- Não recomendado para arquivos muito grandes (>50MB)

#### Passos:

1. **Criar Function App no Azure:**

   ```bash
   az group create --name rag-resource-group --location eastus
   az storage account create --name ragstorage --location eastus --resource-group rag-resource-group --sku Standard_LRS
   az functionapp create --resource-group rag-resource-group --consumption-plan-location eastus --runtime node --runtime-version 20 --functions-version 4 --name rag-system-api --storage-account ragstorage
   ```

2. **Compilar projeto:**

   ```bash
   npm run build
   ```

3. **Copiar arquivos para azure:**

   ```bash
   npm run copy:azure
   ```

4. **Instalar dependências do Azure:**

   ```bash
   cd azure
   npm install
   ```

5. **Compilar Azure:**

   ```bash
   npm run build
   ```

6. **Configurar variáveis de ambiente no Azure:**

   ```bash
   az functionapp config appsettings set --name rag-system-api --resource-group rag-resource-group --settings OLLAMA_URL=http://seu-ollama-url:11434
   ```

7. **Deploy:**
   ```bash
   func azure functionapp publish rag-system-api
   ```

#### Configurar Ollama separadamente (Azure):

Como Azure Functions não pode rodar Ollama diretamente, você precisa:

**Opção A: Azure Container Instance**

```bash
az container create \
  --resource-group rag-resource-group \
  --name ollama-container \
  --image ollama/ollama:latest \
  --dns-name-label ollama-rag \
  --ports 11434 \
  --cpu 4 \
  --memory 8
```

**Opção B: Azure VM**

- Criar VM Linux
- Instalar Ollama
- Configurar firewall para permitir acesso

### Opção 4: Outros Cloud Providers

#### AWS (EC2 + ECS ou Lambda)

- Similar ao Azure Functions
- Ollama em EC2 ou ECS
- API em Lambda ou ECS

#### Google Cloud (Cloud Run + Compute Engine)

- Ollama em Compute Engine
- API em Cloud Run

#### DigitalOcean (Droplet)

- Similar ao servidor próprio
- Droplet com Node.js + Ollama

## 📊 Comparação das Opções

| Opção                | Complexidade | Custo    | Escalabilidade | Recomendado Para                      |
| -------------------- | ------------ | -------- | -------------- | ------------------------------------- |
| **Servidor Próprio** | Média        | Baixo    | Média          | Projetos pequenos/médios              |
| **Docker**           | Baixa        | Baixo    | Média          | ✅ **Recomendado** - Fácil manutenção |
| **Azure Functions**  | Alta         | Médio    | Alta           | Serverless, alto tráfego              |
| **Outros Cloud**     | Alta         | Variável | Alta           | Empresas grandes                      |

## 🔧 Configurações de Produção

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# Ambiente
NODE_ENV=production

# Porta do servidor
PORT=3000

# URL do Ollama (ajuste conforme sua instalação)
OLLAMA_URL=http://localhost:11434
# Para Docker: http://ollama:11434
# Para servidor remoto: http://ip-do-servidor:11434

# Opcional: Configurações de timeout
REQUEST_TIMEOUT=300000
```

### Otimizações de Produção

1. **Aumentar memória do Node.js:**

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. **Usar PM2 para gerenciamento:**

   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name rag-api --max-memory-restart 2G
   ```

3. **Configurar logs:**

   ```bash
   # PM2 salva logs automaticamente
   pm2 logs rag-api
   ```

4. **Monitoramento:**
   ```bash
   # Health check endpoint
   curl http://localhost:3000/api/health
   ```

## 🧪 Testando a API

### Usando curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Query com arquivo
curl -X POST http://localhost:3000/api/query \
  -F "file=@documento.pdf" \
  -F "query=Qual é o conteúdo do documento?"

# Query sem arquivo (usa conhecimento do modelo)
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Qual é o tema principal?"}'

# Resetar Circuit Breaker (se necessário)
curl -X POST http://localhost:3000/api/circuit-breaker/reset
```

### Usando scripts de teste:

```bash
# Testes simples
npm run test:simple

# Teste de carga (100 requisições paralelas)
npm run test:load
```

### Usando K6 (testes de performance):

```bash
# Teste básico
npm run test:k6:basic

# Teste de carga
npm run test:k6:load

# Teste de stress
npm run test:k6:stress

# Teste completo
npm run test:k6:full
```

### Usando Postman:

Importe a collection: `RAG_API.postman_collection.json`

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```env
# Servidor
PORT=3000
NODE_ENV=production

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_MAX_CONCURRENT=20
OLLAMA_NUM_PREDICT=2000
OLLAMA_TEMPERATURE=0.7
OLLAMA_TOP_P=0.9

# RAG
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2

# Redis (opcional)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Circuit Breaker
CIRCUIT_BREAKER_TIMEOUT=120000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sessões
SESSIONS_MAX_AGE_MINUTES=60
SESSIONS_CLEANUP_INTERVAL_MINUTES=30
```

### Personalizar Configurações

Edite `src/config/index.ts` ou use variáveis de ambiente:

- **Tamanho de chunks**: `CHUNK_SIZE=1000`, `CHUNK_OVERLAP=200`
- **Modelo de embeddings**: `EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2`
- **Modelo LLM**: `OLLAMA_MODEL=llama3.2`
- **URL do Ollama**: `OLLAMA_URL=http://localhost:11434`
- **Porta do servidor**: `PORT=3000`

Veja `.env.example` para todas as opções disponíveis.

## 🐛 Troubleshooting

### Ollama não conecta

```bash
# Verificar se está rodando
curl http://localhost:11434/api/tags
ollama list

# Iniciar (se necessário)
ollama serve
```

### Modelo não encontrado

```bash
# Baixar modelo
ollama pull llama3.2
```

### Erros comuns

```bash
# Reinstalar dependências
npm install

# Corrigir lint
npm run lint:fix

# Ver erros de build
npm run build

# Porta em uso
lsof -i :3000  # Verificar
PORT=3001      # Mudar no .env

# Docker não inicia
docker-compose logs
docker-compose build --no-cache
```

## 📚 Recursos Adicionais

- [Documentação Hono.js](https://hono.dev/docs/)
- [Ollama](https://ollama.ai/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Azure Functions](https://docs.microsoft.com/azure/azure-functions/)

## 📝 Licença

MIT

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch (`git checkout -b feat/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m "feat: adiciona nova funcionalidade"`)
4. Push para a branch (`git push origin feat/nova-funcionalidade`)
5. Abra um Pull Request

**Nota:** Commits devem seguir Conventional Commits (validado automaticamente pelo Husky).
