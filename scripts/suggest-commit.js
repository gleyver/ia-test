#!/usr/bin/env node
/**
 * Script para sugerir tipo de commit baseado nos arquivos modificados
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-status', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

function getUnstagedFiles() {
  try {
    const output = execSync('git diff --name-status', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

function getModifiedFiles() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

function analyzeFileChanges(files) {
  const analysis = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
    types: {
      feat: 0,
      fix: 0,
      docs: 0,
      style: 0,
      refactor: 0,
      test: 0,
      build: 0,
      ci: 0,
      chore: 0,
    },
    scopes: new Set(),
  };

  for (const line of files) {
    const [status, ...pathParts] = line.split(/\s+/);
    const file = pathParts.join(' ');

    // Ignorar arquivos de configuração do Git
    if (file.includes('.git/') || file.includes('node_modules/')) {
      continue;
    }

    // Determinar tipo de mudança
    if (status.startsWith('A') || status === '??') {
      analysis.added.push(file);
    } else if (status.startsWith('D')) {
      analysis.deleted.push(file);
    } else if (status.startsWith('R')) {
      analysis.renamed.push(file);
    } else {
      analysis.modified.push(file);
    }

    // Analisar tipo de arquivo e sugerir tipo de commit
    if (file.includes('test/') || file.includes('.test.') || file.includes('.spec.')) {
      analysis.types.test++;
    } else if (file.includes('docs/') || file.includes('README') || file.endsWith('.md')) {
      analysis.types.docs++;
    } else if (file.includes('src/') || file.endsWith('.ts') || file.endsWith('.js')) {
      // Analisar conteúdo para determinar se é feat, fix ou refactor
      try {
        const diff = execSync(`git diff --cached ${file} 2>/dev/null || git diff ${file} 2>/dev/null || echo ""`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        });

        // Detectar padrões
        if (diff.includes('+function') || diff.includes('+export') || diff.includes('+class') || diff.includes('+const') && diff.includes('= new')) {
          analysis.types.feat++;
        } else if (diff.includes('+fix') || diff.includes('+error') || diff.includes('+bug') || diff.includes('-bug')) {
          analysis.types.fix++;
        } else if (diff.includes('refactor') || diff.includes('reorganize') || diff.includes('restructure')) {
          analysis.types.refactor++;
        } else {
          analysis.types.feat++; // Default para feat se não conseguir determinar
        }
      } catch (error) {
        // Se não conseguir analisar, assume feat
        analysis.types.feat++;
      }
    } else if (file.includes('package.json') || file.includes('tsconfig.json') || file.includes('.eslintrc') || file.includes('Dockerfile')) {
      analysis.types.build++;
    } else if (file.includes('.github/') || file.includes('.gitlab-ci') || file.includes('azure-pipelines')) {
      analysis.types.ci++;
    } else if (file.includes('.prettierrc') || file.includes('.editorconfig')) {
      analysis.types.style++;
    } else {
      analysis.types.chore++;
    }

    // Extrair escopo do caminho do arquivo
    const scopeParts = file.split('/');
    if (scopeParts.length > 1) {
      const scope = scopeParts[0];
      if (scope && !scope.includes('.') && scope !== 'src' && scope !== 'dist') {
        analysis.scopes.add(scope);
      } else if (scopeParts.length > 2 && scopeParts[0] === 'src') {
        analysis.scopes.add(scopeParts[1]);
      }
    }
  }

  return analysis;
}

function suggestCommitType(analysis) {
  const suggestions = [];

  // Ordenar tipos por frequência
  const sortedTypes = Object.entries(analysis.types)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);

  if (sortedTypes.length === 0) {
    return { type: 'chore', confidence: 'low', reason: 'Nenhuma mudança detectada' };
  }

  const [primaryType, primaryCount] = sortedTypes[0];
  const totalChanges = analysis.added.length + analysis.modified.length + analysis.deleted.length;

  let confidence = 'medium';
  let reason = '';

  // Lógica de sugestão
  if (primaryCount >= totalChanges * 0.7) {
    confidence = 'high';
    reason = `${primaryCount} arquivo(s) modificado(s) indicam "${primaryType}"`;
  } else if (sortedTypes.length === 1) {
    confidence = 'high';
    reason = `Todos os arquivos modificados indicam "${primaryType}"`;
  } else {
    confidence = 'medium';
    const secondaryType = sortedTypes[1][0];
    reason = `Principalmente "${primaryType}" (${primaryCount}), mas também "${secondaryType}" (${sortedTypes[1][1]})`;
  }

  // Ajustes baseados em padrões específicos
  if (analysis.added.length > analysis.modified.length && analysis.added.length > 0) {
    if (primaryType === 'feat' || primaryType === 'test') {
      confidence = 'high';
      reason = `${analysis.added.length} novo(s) arquivo(s) adicionado(s)`;
    }
  }

  if (analysis.deleted.length > 0) {
    if (primaryType === 'refactor' || primaryType === 'chore') {
      confidence = 'high';
      reason = `${analysis.deleted.length} arquivo(s) removido(s)`;
    }
  }

  // Traduzir razão para português
  let translatedReason = reason;
  if (reason.includes('arquivo(s) modificado(s)')) {
    translatedReason = `${primaryCount} arquivo(s) modificado(s) indicam "${primaryType}"`;
  } else if (reason.includes('Todos os arquivos')) {
    translatedReason = `Todos os arquivos modificados indicam "${primaryType}"`;
  } else if (reason.includes('Principalmente')) {
    const secondaryType = sortedTypes[1][0];
    translatedReason = `Principalmente "${primaryType}" (${primaryCount}), mas também "${secondaryType}" (${sortedTypes[1][1]})`;
  } else if (reason.includes('novo(s) arquivo(s)')) {
    translatedReason = `${analysis.added.length} novo(s) arquivo(s) adicionado(s)`;
  } else if (reason.includes('arquivo(s) removido(s)')) {
    translatedReason = `${analysis.deleted.length} arquivo(s) removido(s)`;
  } else if (reason.includes('Nenhuma mudança')) {
    translatedReason = 'Nenhuma mudança detectada';
  }

  return {
    type: primaryType,
    confidence,
    reason: translatedReason,
    alternatives: sortedTypes.slice(1, 3).map(([type]) => type),
  };
}

function suggestScope(analysis) {
  if (analysis.scopes.size === 0) {
    return null;
  }

  if (analysis.scopes.size === 1) {
    return Array.from(analysis.scopes)[0];
  }

  // Se houver múltiplos escopos, retornar o mais comum ou null
  return null;
}

function main() {
  const stagedFiles = getStagedFiles();
  const unstagedFiles = getUnstagedFiles();
  const allFiles = [...stagedFiles, ...unstagedFiles];

  if (allFiles.length === 0) {
    console.log(`${colors.yellow}⚠️  Nenhum arquivo modificado detectado${colors.reset}`);
    return;
  }

  const analysis = analyzeFileChanges(allFiles);
  const suggestion = suggestCommitType(analysis);
  const scope = suggestScope(analysis);

  console.log(`\n${colors.cyan}${colors.bright}📝 Sugestão de Commit${colors.reset}\n`);

  console.log(`${colors.bright}Arquivos analisados:${colors.reset}`);
  if (analysis.added.length > 0) {
    console.log(`  ${colors.green}+${colors.reset} ${analysis.added.length} adicionado(s)`);
  }
  if (analysis.modified.length > 0) {
    console.log(`  ${colors.yellow}~${colors.reset} ${analysis.modified.length} modificado(s)`);
  }
  if (analysis.deleted.length > 0) {
    console.log(`  ${colors.red}-${colors.reset} ${analysis.deleted.length} removido(s)`);
  }

  console.log(`\n${colors.bright}Sugestão:${colors.reset}`);
  const scopeStr = scope ? `(${scope})` : '';

  // Traduzir tipos para português
  const typeTranslations = {
    feat: 'feat',
    fix: 'fix',
    docs: 'docs',
    style: 'style',
    refactor: 'refactor',
    perf: 'perf',
    test: 'test',
    build: 'build',
    ci: 'ci',
    chore: 'chore',
    revert: 'revert',
  };

  const translatedType = typeTranslations[suggestion.type] || suggestion.type;
  console.log(`  ${colors.green}${colors.bright}${translatedType}${scopeStr}: ${colors.reset}${suggestion.reason}`);

  if (suggestion.confidence === 'high') {
    console.log(`  ${colors.green}✓${colors.reset} Alta confiança`);
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset}  Média confiança`);
  }

  if (suggestion.alternatives.length > 0) {
    console.log(`\n${colors.bright}Alternativas:${colors.reset}`);
    suggestion.alternatives.forEach((alt) => {
      console.log(`  • ${alt}`);
    });
  }

  if (scope) {
    console.log(`\n${colors.bright}Escopo sugerido:${colors.reset} ${colors.blue}${scope}${colors.reset}`);
  }

  console.log('');
}

main();

