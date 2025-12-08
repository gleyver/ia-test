/**
 * Teste Completo - Todos os cenários combinados
 * Valida todas as funcionalidades da Fase 1
 */

import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const testDocs = new SharedArray('docs', function () {
  return [
    'Inteligência artificial é o futuro da tecnologia.',
    'Machine learning permite que computadores aprendam.',
    'RAG combina busca e geração de texto.',
    'Embeddings representam significado em vetores.',
  ];
});

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:health}': ['p(95)<1000'],
    'http_req_duration{name:query}': ['p(95)<10000'],
    'http_req_duration{name:stats}': ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.90'],
  },
};

export default function () {
  const uniqueId = randomString(10);

  // Teste 1: Health Check
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health' },
  });
  check(healthRes, {
    'health check ok': (r) => r.status === 200 && JSON.parse(r.body).status === 'ok',
  });

  sleep(0.5);

  // Teste 2: Query sem arquivo (50% das requisições)
  if (Math.random() > 0.5) {
    const queryRes = http.post(
      `${BASE_URL}/api/query`,
      JSON.stringify({
        query: `Pergunta ${uniqueId}: O que é IA?`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'query' },
        timeout: '15s',
      }
    );

    check(queryRes, {
      'query without file success': (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });
  } else {
    // Teste 3: Query com arquivo (50% das requisições)
    const testDoc = testDocs[Math.floor(Math.random() * testDocs.length)];
    const formData = {
      file: http.file(testDoc, `test-${uniqueId}.txt`, 'text/plain'),
      query: `Pergunta ${uniqueId}: Qual é o conteúdo?`,
    };

    const queryRes = http.post(`${BASE_URL}/api/query`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      tags: { name: 'query' },
      timeout: '30s',
    });

    check(queryRes, {
      'query with file success': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.fileProcessed !== null;
        } catch {
          return false;
        }
      },
      'query with file has response': (r) => {
        try {
          return JSON.parse(r.body).response && JSON.parse(r.body).response.length > 0;
        } catch {
          return false;
        }
      },
    });
  }

  sleep(1);

  // Teste 4: Estatísticas (a cada 10 requisições)
  if (Math.random() < 0.1) {
    const statsRes = http.get(`${BASE_URL}/api/collection/info`, {
      tags: { name: 'stats' },
    });
    check(statsRes, {
      'stats ok': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs.values.count;
  const failedReqs = data.metrics.http_req_failed.values.count;
  const successRate = ((totalReqs - failedReqs) / totalReqs * 100).toFixed(2);

  return {
    'stdout': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Teste Completo - Todos os Cenários
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Requisições Totais: ${totalReqs}
✅ Taxa de Sucesso: ${successRate}%
📊 Checks: ${data.metrics.checks.values.passes}/${data.metrics.checks.values.count}

Tempos de Resposta:
  • Health: ${(data.metrics['http_req_duration{name:health}'].values.avg / 1000).toFixed(2)}s
  • Query: ${(data.metrics['http_req_duration{name:query}'].values.avg / 1000).toFixed(2)}s
  • Stats: ${(data.metrics['http_req_duration{name:stats}'].values.avg / 1000).toFixed(2)}s

P95 (95% das requisições):
  • Health: ${(data.metrics['http_req_duration{name:health}'].values['p(95)'] / 1000).toFixed(2)}s
  • Query: ${(data.metrics['http_req_duration{name:query}'].values['p(95)'] / 1000).toFixed(2)}s

${successRate >= 95 ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️  Alguns problemas detectados'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
    'k6-full-results.json': JSON.stringify(data, null, 2),
  };
}
