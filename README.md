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
- **Husky**: Git hooks para validação automática

## 📦 Como Baixar e Instalar

### 1. Pré-requisitos

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

### 6. Configurar variáveis de ambiente (opcional)

Crie um arquivo `.env` na raiz:

```env
PORT=3000
OLLAMA_URL=http://localhost:11434
```

## 🚀 Como Rodar

### Desenvolvimento (com auto-reload):

```bash
npm run dev
```

### Produção:

```bash
npm start
```

### Ou compilar e rodar:

```bash
npm run build
node dist/server.js
```

O servidor estará disponível em: `http://localhost:3000`

## 📡 API Endpoints

### `GET /api/health`

Health check do sistema.

**Resposta:**

```json
{
  "status": "ok",
  "message": "RAG System running"
}
```

### `POST /api/query`

Upload de documento + query em uma única chamada.

**Form Data (multipart/form-data):**

- `file`: Arquivo (PDF, DOCX, TXT, HTML) - opcional
- `query`: Pergunta/consulta - obrigatório

**JSON (application/json):**

```json
{
  "query": "Qual é o conteúdo do documento?"
}
```

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

**Form Data:**

- `file`: Arquivo (PDF, DOCX, TXT, HTML)

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

Limpa toda a coleção de documentos.

**Resposta:**

```json
{
  "success": true,
  "message": "Coleção limpa"
}
```

## 📁 Estrutura do Projeto

```
IA/
├── src/                    # Código fonte TypeScript
│   ├── app.ts             # Aplicação Hono centralizada (rotas e lógica)
│   ├── chunker.ts         # Divisão de texto em chunks
│   ├── documentProcessor.ts  # Processamento de documentos (PDF, DOCX, etc)
│   ├── embeddings.ts      # Geração de embeddings
│   ├── generator.ts        # Geração de respostas (LLM)
│   ├── retriever.ts        # Busca de documentos relevantes
│   ├── types.ts           # Tipos TypeScript compartilhados
│   ├── utils.ts           # Funções utilitárias
│   └── vectorDb.ts        # Vector database customizada
│
├── azure/                  # Configuração para Azure Functions
│   ├── index.ts           # Entry point para Azure Functions
│   ├── function.json      # Configuração da Function
│   ├── host.json          # Configuração do host
│   ├── package.json       # Dependências específicas do Azure
│   └── tsconfig.json      # Configuração TypeScript para Azure
│
├── dist/                   # Arquivos compilados (gerado automaticamente)
├── vector_db/              # Vector database (JSON files)
│   └── documents.json     # Documentos indexados
│
├── server.ts               # Servidor Node.js (importa src/app.ts)
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configuração TypeScript
├── eslint.config.js        # Configuração ESLint
├── .prettierrc.json        # Configuração Prettier
├── .commitlintrc.json      # Configuração Conventional Commits
├── .husky/                 # Git hooks (Husky)
│   ├── pre-commit         # Valida lint e build antes do commit
│   └── commit-msg         # Valida formato do commit
└── README.md              # Este arquivo
```

## 📄 Descrição dos Arquivos

### Código Fonte (`src/`)

#### `src/app.ts`

**Aplicação Hono centralizada** - Contém todas as rotas e lógica do sistema RAG. Este arquivo é importado tanto pelo servidor Node.js (`server.ts`) quanto pelo Azure Functions (`azure/index.ts`), garantindo que a mesma lógica funcione em ambos os ambientes.

**Rotas:**

- `GET /api/health` - Health check
- `POST /api/query` - Upload + query
- `POST /api/documents/upload` - Upload de documento
- `GET /api/collection/info` - Informações da coleção
- `DELETE /api/collection` - Limpar coleção

#### `src/chunker.ts`

**Divisão de texto em chunks** - Divide textos longos em pedaços menores com overlap configurável. Garante que o contexto seja preservado entre chunks.

**Configuração padrão:**

- `chunkSize`: 1000 tokens
- `chunkOverlap`: 200 tokens

#### `src/documentProcessor.ts`

**Processamento de documentos** - Suporta múltiplos formatos:

- **PDF**: Extração de texto + OCR automático para PDFs escaneados
- **DOCX**: Extração de texto usando mammoth
- **HTML/TXT**: Leitura direta

**Recursos:**

- OCR automático quando PDF tem pouco texto
- Suporte a arquivos até 200MB
- Extração de metadados

#### `src/embeddings.ts`

**Geração de embeddings** - Usa `@xenova/transformers` para gerar embeddings localmente.

**Modelo padrão:** `Xenova/all-MiniLM-L6-v2`

#### `src/vectorDb.ts`

**Vector database customizada** - Armazena documentos e embeddings em JSON. Implementa busca por similaridade usando cosine similarity.

**Recursos:**

- Armazenamento local (sem dependências externas)
- Busca por similaridade
- Filtros por metadados
- Limpeza automática por requisição

#### `src/retriever.ts`

**Sistema de recuperação** - Busca documentos relevantes baseado na query do usuário.

**Processo:**

1. Gera embedding da query
2. Busca documentos similares na vector DB
3. Retorna top K documentos mais relevantes

#### `src/generator.ts`

**Geração de respostas** - Usa Ollama (LLM local) para gerar respostas baseadas no contexto recuperado.

**Modelo padrão:** `llama3.2`

#### `src/types.ts`

**Tipos TypeScript compartilhados** - Define todas as interfaces e tipos usados no sistema.

#### `src/utils.ts`

**Funções utilitárias** - Funções auxiliares como `cosineSimilarity`.

### Arquivos de Configuração

#### `server.ts`

**Servidor Node.js** - Entry point para desenvolvimento local. Importa `src/app.ts` e inicia o servidor HTTP na porta 3000.

#### `azure/index.ts`

**Entry point Azure Functions** - Adapta a aplicação Hono para Azure Functions usando `@marplex/hono-azurefunc-adapter`.

#### `package.json`

**Dependências e scripts** - Gerencia todas as dependências do projeto e scripts npm.

**Scripts principais:**

- `npm start` - Inicia servidor
- `npm run dev` - Modo desenvolvimento (auto-reload)
- `npm run build` - Compila TypeScript
- `npm run lint` - Valida lint
- `npm run lint:fix` - Corrige lint automaticamente

#### `tsconfig.json`

**Configuração TypeScript** - Define opções de compilação estritas:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- E mais...

#### `eslint.config.js`

**Configuração ESLint** - Regras de linting para TypeScript:

- Proíbe uso de `any`
- Valida tipos
- Integrado com Prettier

#### `.prettierrc.json`

**Configuração Prettier** - Formatação automática de código.

#### `.commitlintrc.json`

**Configuração Conventional Commits** - Valida formato das mensagens de commit.

### Azure Functions (`azure/`)

#### `azure/index.ts`

**Entry point Azure Functions** - Importa `src/app.ts` e adapta para Azure Functions v4.

#### `azure/function.json`

**Configuração da Function** - Define HTTP trigger com todos os métodos.

#### `azure/host.json`

**Configuração do host** - Timeout, logging, etc.

#### `azure/package.json`

**Dependências do Azure** - Inclui `@azure/functions` e `@marplex/hono-azurefunc-adapter`.

## 🐕 Husky - Git Hooks

O projeto usa **Husky** para validar código e commits automaticamente.

### O que é Husky?

Husky é uma ferramenta que executa scripts automaticamente em eventos do Git (como antes de fazer commit).

### Hooks Configurados

#### `.husky/pre-commit`

Executa **antes** de cada commit:

1. **lint-staged**: Valida e corrige lint apenas nos arquivos que serão commitados
2. **Build**: Valida se o TypeScript compila sem erros

**Se algum teste falhar, o commit é bloqueado!**

#### `.husky/commit-msg`

Valida o formato da mensagem de commit:

- ✅ Deve seguir **Conventional Commits**
- ✅ Formato: `tipo: descrição`
- ✅ Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### Como Fazer Commits

#### Opção 1: Interface Interativa com Sugestões (Recomendado) 🎯

Use o **Commitizen** que oferece uma interface interativa passo a passo **com sugestões automáticas** baseadas nos arquivos modificados:

```bash
npm run commit
# ou
git commit
```

**Antes de abrir o menu**, o sistema analisa seus arquivos modificados e mostra uma sugestão:

```
📝 Sugestão de Commit

Arquivos analisados:
  + 2 adicionado(s)
  ~ 5 modificado(s)

Sugestão:
  feat(api): 5 arquivo(s) modificado(s) indicam "feat"
  ✓ Alta confiança

Alternativas:
  • fix
  • refactor

Escopo sugerido: api
```

Depois você verá o menu interativo do Commitizen:

```
? Select the type of change that you're committing: (Use arrow keys)
❯ feat:     A new feature
  fix:      A bug fix
  docs:     Documentation only changes
  style:    Changes that do not affect the meaning of the code
  refactor: A code change that neither fixes a bug nor adds a feature
  perf:     A code change that improves performance
  test:     Adding missing tests or correcting existing tests
  build:    Changes that affect the build system or external dependencies
  ci:       Changes to our CI configuration files and scripts
  chore:    Other changes that don't modify src or test files
  revert:   Reverts a previous commit
```

Depois você será perguntado:

- **Scope** (opcional): Qual parte do código foi afetada
- **Subject**: Descrição curta do que foi feito
- **Body** (opcional): Descrição detalhada
- **Breaking changes** (opcional): Se há mudanças que quebram compatibilidade
- **Issues** (opcional): Números de issues relacionadas

**Exemplo de uso:**

```bash
$ npm run commit

? Select the type of change: feat
? What is the scope of this change: api
? Write a short, imperative tense description: adiciona endpoint de health check
? Provide a longer description: Adiciona endpoint GET /api/health para verificar status do sistema
? Are there any breaking changes? No
? Does this change affect any open issues? No

[master abc1234] feat(api): adiciona endpoint de health check
```

#### Opção 2: Commit Manual

Se preferir escrever manualmente, use o formato:

```bash
git commit -m "tipo(escopo): descrição"
```

**✅ Exemplos válidos:**

```bash
git commit -m "feat: adiciona suporte a Azure Functions"
git commit -m "fix: corrige erro de parsing de PDF"
git commit -m "docs: atualiza README"
git commit -m "feat(api): adiciona endpoint de health check"
git commit -m "fix(vectorDb): corrige busca por similaridade"
```

**❌ Exemplos inválidos (serão bloqueados):**

```bash
git commit -m "adiciona funcionalidade"        # Sem tipo
git commit -m "FEAT: adiciona"                # Tipo em maiúscula
git commit -m "feat: Adiciona funcionalidade" # Subject em maiúscula
git commit -m "feat:"                         # Sem subject
```

### Benefícios

- ✅ **Qualidade**: Código sempre validado antes do commit
- ✅ **Consistência**: Formatação automática
- ✅ **Histórico**: Commits padronizados e fáceis de entender
- ✅ **Prevenção**: Erros detectados antes de chegar ao repositório

### Scripts Relacionados

```bash
# Fazer commit com interface interativa (recomendado)
npm run commit

# Ver sugestão de commit baseado nos arquivos modificados
npm run suggest

# Validar lint manualmente
npm run lint

# Corrigir problemas de lint automaticamente
npm run lint:fix

# Formatar código
npm run format
```

### Como Funciona a Sugestão Automática?

O sistema analisa automaticamente:

- ✅ **Arquivos adicionados/modificados/removidos**
- ✅ **Tipo de mudança** (novo código, correção, refatoração)
- ✅ **Localização dos arquivos** (src/, test/, docs/, etc.)
- ✅ **Conteúdo das mudanças** (novas funções, correções de bug, etc.)
- ✅ **Escopo sugerido** baseado na estrutura de pastas

**Exemplos de detecção:**

- Arquivos em `src/` com novas funções → `feat`
- Arquivos de teste → `test`
- Correções de erro → `fix`
- Arquivos de documentação → `docs`
- Mudanças em `package.json` → `build`
- Refatoração de código → `refactor`

### Dica: Alias Git (Opcional)

Para usar `git commit` diretamente com interface interativa, adicione um alias:

```bash
git config --global alias.cz "!npm run commit"
```

Depois você pode usar:

```bash
git cz  # Abre a interface interativa
```

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

## 🧪 Testar em Produção

### 1. Health Check:

```bash
curl http://seu-servidor:3000/api/health
```

### 2. Upload e Query:

```bash
curl -X POST http://seu-servidor:3000/api/query \
  -F "file=@documento.pdf" \
  -F "query=Qual é o conteúdo do documento?"
```

### 3. Verificar logs:

```bash
# Docker
docker-compose logs -f rag-api

# PM2
pm2 logs rag-api

# Systemd
journalctl -u rag-system -f
```

## 🐛 Troubleshooting Produção

### Ollama não conecta:

```bash
# Verificar se Ollama está rodando
curl http://localhost:11434/api/tags

# Verificar variável de ambiente
echo $OLLAMA_URL

# Testar conexão
curl http://ollama-url:11434/api/tags
```

### Erro de memória:

```bash
# Aumentar memória do Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Ou no PM2
pm2 restart rag-api --update-env --max-memory-restart 4G
```

### Porta já em uso:

```bash
# Verificar o que está usando a porta
lsof -i :3000

# Mudar porta no .env
PORT=3001
```

### Docker não inicia:

```bash
# Verificar logs
docker-compose logs

# Reconstruir imagens
docker-compose build --no-cache
docker-compose up -d
```

Veja a documentação completa em: [Guia de Deploy Azure](https://docs.microsoft.com/azure/azure-functions/)

## 🧪 Testando a API

### Usando curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Query com arquivo
curl -X POST http://localhost:3000/api/query \
  -F "file=@documento.pdf" \
  -F "query=Qual é o conteúdo do documento?"

# Query sem arquivo (usa documentos já indexados)
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Qual é o tema principal?"}'
```

### Usando Postman:

Importe a collection: `RAG_API.postman_collection.json`

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

Crie um arquivo `.env`:

```env
PORT=3000
OLLAMA_URL=http://localhost:11434
```

### Ajustar Tamanho de Chunks

Edite `src/app.ts`:

```typescript
const chunker = new TextChunker({
  chunkSize: 1000, // Tamanho do chunk
  chunkOverlap: 200, // Overlap entre chunks
});
```

### Mudar Modelo de Embeddings

Edite `src/app.ts`:

```typescript
const embeddingGenerator = new EmbeddingGenerator({
  model: "Xenova/all-MiniLM-L6-v2",
});
```

### Mudar Modelo LLM

Edite `src/app.ts` ou variável de ambiente:

```typescript
const responseGenerator = new ResponseGenerator({
  model: "llama3.2",
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
});
```

## 🐛 Troubleshooting

### Erro: "Ollama não encontrado"

```bash
# Verificar se Ollama está rodando
ollama list

# Iniciar Ollama (se necessário)
ollama serve
```

### Erro: "Modelo não carregado"

```bash
# Baixar modelo
ollama pull llama3.2
```

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
npm install
```

### Commit bloqueado pelo Husky

```bash
# Corrigir lint automaticamente
npm run lint:fix

# Ou formatar código
npm run format
```

### Erro de build

```bash
# Ver erros detalhados
npm run build

# Corrigir erros de TypeScript
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
