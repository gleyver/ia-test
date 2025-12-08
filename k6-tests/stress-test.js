/**
 * Teste de Stress - 1000 usuários simultâneos
 * Testa limites do sistema e identifica pontos de quebra
 */

import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '2m', target: 200 },  // Ramp up para 200
    { duration: '2m', target: 500 },  // Ramp up para 500
    { duration: '2m', target: 1000 }, // Ramp up para 1000
    { duration: '3m', target: 1000 }, // Manter 1000
    { duration: '2m', target: 500 },  // Ramp down
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<20000'], // 95% < 20s (mais tolerante)
    http_req_failed: ['rate<0.10'],      // Taxa de erro < 10% (stress test)
    checks: ['rate>0.80'],               // 80% dos checks passam
  },
};

export default function () {
  const uniqueId = randomString(10);

  // Alternar entre query com e sem arquivo
  const useFile = Math.random() > 0.5;

  if (useFile) {
    // Query com arquivo (mais pesado)
    const formData = {
      file: http.file(
        `Documento de teste ${uniqueId}. Contém informações sobre RAG e processamento de documentos.`,
        'test.txt',
        'text/plain'
      ),
      query: `Pergunta ${uniqueId}: Qual é o conteúdo?`,
    };

    const res = http.post(`${BASE_URL}/api/query`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: '30s',
    });

    check(res, {
      'status is 200': (r) => r.status === 200,
      'has response': (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });
  } else {
    // Query sem arquivo (mais leve)
    const queryRes = http.post(
      `${BASE_URL}/api/query`,
      JSON.stringify({
        query: `Pergunta ${uniqueId}: O que é inteligência artificial?`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '15s',
      }
    );

    check(queryRes, {
      'status is 200': (r) => r.status === 200,
      'has response': (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });
  }

  sleep(Math.random() * 2 + 1); // Sleep aleatório entre 1-3s
}

export function handleSummary(data) {
  return {
    'stdout': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Teste de Stress - 1000 Usuários
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Requisições: ${data.metrics.http_reqs.values.count}
📊 Taxa de Erro: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
📊 Tempo Médio: ${(data.metrics.http_req_duration.values.avg / 1000).toFixed(2)}s
📊 P95: ${(data.metrics.http_req_duration.values['p(95)'] / 1000).toFixed(2)}s
📊 P99: ${(data.metrics.http_req_duration.values['p(99)'] / 1000).toFixed(2)}s

${data.metrics.http_req_failed.values.rate < 0.10 ? '✅ Sistema aguentou o stress!' : '⚠️  Sistema teve problemas'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
    'k6-stress-results.json': JSON.stringify(data, null, 2),
  };
}
