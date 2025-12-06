module.exports = {
  types: [
    { value: 'feat', name: 'feat:     Uma nova funcionalidade' },
    { value: 'fix', name: 'fix:      Correção de um bug' },
    { value: 'docs', name: 'docs:     Apenas mudanças na documentação' },
    {
      value: 'style',
      name: 'style:    Mudanças que não afetam o significado do código\n            (espaços em branco, formatação, ponto e vírgula faltando, etc)',
    },
    {
      value: 'refactor',
      name: 'refactor: Uma mudança de código que nem corrige um bug nem adiciona uma funcionalidade',
    },
    {
      value: 'perf',
      name: 'perf:     Uma mudança de código que melhora a performance',
    },
    {
      value: 'test',
      name: 'test:     Adicionando testes faltando ou corrigindo testes existentes',
    },
    {
      value: 'build',
      name: 'build:    Mudanças que afetam o sistema de build ou dependências externas\n            (exemplo: npm, yarn, webpack, gulp)',
    },
    {
      value: 'ci',
      name: 'ci:       Mudanças em nossos arquivos e scripts de configuração CI\n            (exemplo: GitHub Actions, Circle, Travis, etc)',
    },
    {
      value: 'chore',
      name: 'chore:    Outras mudanças que não modificam src ou arquivos de teste',
    },
    { value: 'revert', name: 'revert:   Reverte um commit anterior' },
  ],

  scopes: [
    { name: 'api', description: 'Endpoints e rotas da API' },
    { name: 'app', description: 'Aplicação principal (src/app.ts)' },
    { name: 'azure', description: 'Configuração Azure Functions' },
    { name: 'chunker', description: 'Divisão de texto em chunks' },
    { name: 'docs', description: 'Documentação (README, etc)' },
    { name: 'embeddings', description: 'Geração de embeddings' },
    { name: 'generator', description: 'Geração de respostas (LLM)' },
    { name: 'retriever', description: 'Sistema de recuperação' },
    { name: 'vectorDb', description: 'Vector database' },
    { name: 'documentProcessor', description: 'Processamento de documentos' },
    { name: 'config', description: 'Arquivos de configuração' },
    { name: 'deps', description: 'Dependências (package.json)' },
    { name: 'husky', description: 'Git hooks e validações' },
    { name: 'scripts', description: 'Scripts utilitários' },
    { name: 'docker', description: 'Configuração Docker' },
    { name: 'types', description: 'Tipos TypeScript' },
    { name: 'utils', description: 'Funções utilitárias' },
    { name: 'server', description: 'Servidor Node.js' },
  ],

  // Usar os escopos acima. Você pode deixar vazio para pular.
  scopeOverrides: {
    // Exemplo para tipos específicos
  },

  // Permitir escopo customizado além dos pré-definidos
  allowCustomScopes: true,

  // override the messages, defaults are as follows
  messages: {
    type: "Selecione o tipo de mudança que você está fazendo commit:",
    scope: '\nSelecione o escopo desta mudança (opcional):',
    // usado se allowCustomScopes for true
    customScope: 'Digite o escopo customizado desta mudança:',
    subject: 'Escreva uma descrição curta e imperativa da mudança:\n',
    body: 'Forneça uma descrição mais longa da mudança (opcional). Use "|" para quebrar nova linha:\n',
    breaking: 'Liste quaisquer BREAKING CHANGES (opcional):\n',
    footer: 'Liste quaisquer issues fechadas por esta mudança (opcional). Ex: #31, #234:\n',
    confirmCommit: 'Tem certeza que deseja prosseguir com o commit acima?',
  },
  allowBreakingChanges: ['feat', 'fix'],
  // skip any questions you want
  skipQuestions: [],

  // limit subject length
  subjectLimit: 100,
  breaklineChar: '|',
  footerPrefix: '',
  askForBreakingChangeFirst: false,
};

