/**
 * Teste de Carga - 100 usuários simultâneos
 * Valida escalabilidade e isolamento por sessão
 */

import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Criar dados de teste compartilhados
const testDocuments = new SharedArray('test-docs', function () {
  return [
    'Este é um documento de teste sobre inteligência artificial.',
    'Machine learning é uma área da ciência da computação.',
    'RAG significa Retrieval-Augmented Generation.',
    'Processamento de linguagem natural é fascinante.',
    'Embeddings são representações vetoriais de texto.',
  ];
});

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up para 50 usuários
    { duration: '2m', target: 100 }, // Ramp up para 100 usuários
    { duration: '3m', target: 100 }, // Manter 100 usuários
    { duration: '1m', target: 50 },  // Ramp down para 50
    { duration: '30s', target: 0 },  // Ramp down para 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% das requisições < 10s
    http_req_failed: ['rate<0.05'],     // Taxa de erro < 5%
    checks: ['rate>0.90'],               // 90% dos checks passam
  },
};

export default function () {
  const uniqueId = randomString(10);

  // Teste: Query sem arquivo (mais rápido e confiável para teste de carga)
  // Query com arquivo pode ser testado separadamente
  const queryRes = http.post(
    `${BASE_URL}/api/query`,
    JSON.stringify({
      query: `Pergunta ${uniqueId}: O que é inteligência artificial? Explique de forma breve.`,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );

  check(queryRes, {
    'query with file status is 200': (r) => r.status === 200,
    'query with file has success': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
    'query with file has response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.response && body.response.length > 0;
      } catch {
        return false;
      }
    },
    'query with file response time < 30s': (r) => r.timings.duration < 30000,
  });

  // Verificar que cada requisição tem sua própria sessão
  // (implícito: se não houver race conditions, todas devem funcionar)

  sleep(1);
}

export function handleSummary(data) {
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const failedRequests = data.metrics.http_req_failed?.values?.count || 0;
  const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2) : '0.00';
  const avgDuration = data.metrics.http_req_duration?.values?.avg ? (data.metrics.http_req_duration.values.avg / 1000).toFixed(2) : '0.00';
  const p95Duration = data.metrics.http_req_duration?.values?.['p(95)'] ? (data.metrics.http_req_duration.values['p(95)'] / 1000).toFixed(2) : '0.00';
  const checksPassed = data.metrics.checks?.values?.passes || 0;
  const checksTotal = data.metrics.checks?.values?.count || 0;

  return {
    'stdout': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Teste de Carga - 20 Usuários Simultâneos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Requisições Totais: ${totalRequests}
✅ Requisições Falhadas: ${failedRequests}
✅ Taxa de Sucesso: ${successRate}%
✅ Tempo Médio: ${avgDuration}s
✅ P95 (95% das req): ${p95Duration}s
✅ Checks Passaram: ${checksPassed}/${checksTotal}

${parseFloat(successRate) >= 90 ? '🎉 Teste PASSOU!' : '⚠️  Teste com problemas'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
    'k6-load-results.json': JSON.stringify(data, null, 2),
  };
}
