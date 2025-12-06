// Adapter customizado em português usando cz-conventional-changelog
const conventionalChangelog = require('cz-conventional-changelog');
const config = require('./.cz-config.cjs');

// cz-conventional-changelog é uma função que retorna um adapter quando chamada com opções
// Mas também pode ser usado diretamente como objeto com prompter
// Vamos criar um wrapper que customiza o prompter

const baseAdapter = conventionalChangelog;

module.exports = {
  prompter(cz, commit) {
    // Usar o prompter base mas com nossa configuração customizada
    // O cz-conventional-changelog aceita opções através do package.json ou .cz-config
    // Mas como estamos usando adapter customizado, vamos implementar nosso próprio prompter

    const inquirer = require('inquirer');

    // Carregar configuração
    const questions = [
      {
        type: 'list',
        name: 'type',
        message: config.messages.type,
        choices: config.types,
        pageSize: 11,
      },
      {
        type: config.allowCustomScopes ? 'list' : 'input',
        name: 'scope',
        message: config.messages.scope,
        choices: config.scopes.length > 0 ? config.scopes.map(s => ({
          name: s.description ? `${s.name} - ${s.description}` : s.name,
          value: s.name
        })) : undefined,
        when: () => config.scopes.length > 0 || config.allowCustomScopes,
      },
      {
        type: 'input',
        name: 'customScope',
        message: config.messages.customScope,
        when: (answers) => !answers.scope && config.allowCustomScopes,
      },
      {
        type: 'input',
        name: 'subject',
        message: config.messages.subject,
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'A descrição não pode estar vazia';
          }
          if (input.length > config.subjectLimit) {
            return `A descrição deve ter no máximo ${config.subjectLimit} caracteres`;
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'body',
        message: config.messages.body,
      },
      {
        type: 'confirm',
        name: 'isBreaking',
        message: config.messages.breaking,
        when: () => config.allowBreakingChanges.length > 0,
        default: false,
      },
      {
        type: 'input',
        name: 'breaking',
        message: config.messages.breaking,
        when: (answers) => answers.isBreaking,
      },
      {
        type: 'input',
        name: 'footer',
        message: config.messages.footer,
      },
      {
        type: 'confirm',
        name: 'confirmCommit',
        message: config.messages.confirmCommit,
        default: true,
      },
    ];

    return inquirer.prompt(questions).then((answers) => {
      if (!answers.confirmCommit) {
        process.exit(1);
      }

      const scope = answers.scope || answers.customScope || '';
      const scopeStr = scope ? `(${scope})` : '';
      const breakingStr = answers.breaking ? `\n\nBREAKING CHANGE: ${answers.breaking}` : '';
      const footerStr = answers.footer ? `\n\n${config.footerPrefix}${answers.footer}` : '';
      const bodyStr = answers.body ? `\n\n${answers.body.replace(/\|/g, '\n')}` : '';

      const commitMessage = `${answers.type}${scopeStr}: ${answers.subject}${bodyStr}${breakingStr}${footerStr}`;

      commit(commitMessage);
    });
  }
};
