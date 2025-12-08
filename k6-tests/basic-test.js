/**
 * Teste Básico - 10 usuários simultâneos
 * Valida funcionalidades básicas do sistema
 */

import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up para 10 usuários
    { duration: '1m', target: 10 },  // Manter 10 usuários
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<30000'], // 95% das requisições < 30s (Ollama pode demorar)
    http_req_failed: ['rate<0.10'],     // Taxa de erro < 10% (mais tolerante)
    checks: ['rate>0.80'],               // 80% dos checks passam (mais tolerante)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Teste 1: Health check
  const healthRes = http.get(`${BASE_URL}/api/health`, { timeout: '5s' });
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check has status ok': (r) => {
      try {
        return JSON.parse(r.body).status === 'ok';
      } catch {
        return false;
      }
    },
  });

  sleep(1);

  // Teste 2: Query sem arquivo (conhecimento do modelo)
  const queryWithoutFile = {
    query: `O que é inteligência artificial? Teste ${randomString(5)}`,
  };
  const queryRes = http.post(
    `${BASE_URL}/api/query`,
    JSON.stringify(queryWithoutFile),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s', // Timeout maior para Ollama
    }
  );
  check(queryRes, {
    'query without file status is 200': (r) => r.status === 200,
    'query without file has response': (r) => {
      if (r.status !== 200) return false;
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.response && body.response.length > 0;
      } catch {
        return false;
      }
    },
    'query without file response time < 30s': (r) => r.timings.duration < 30000,
  });

  sleep(2);

  // Teste 3: Estatísticas de sessões
  const statsRes = http.get(`${BASE_URL}/api/collection/info`, { timeout: '5s' });
  check(statsRes, {
    'stats status is 200': (r) => r.status === 200,
    'stats has message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.message && body.stats;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs?.values?.count || 0;
  const failedReqs = data.metrics.http_req_failed?.values?.count || 0;
  const successRate = totalReqs > 0 ? ((totalReqs - failedReqs) / totalReqs * 100).toFixed(2) : '0.00';
  const checksPassed = data.metrics.checks?.values?.passes || 0;
  const checksTotal = data.metrics.checks?.values?.count || 0;
  const avgDuration = data.metrics.http_req_duration?.values?.avg ? (data.metrics.http_req_duration.values.avg / 1000).toFixed(2) : '0.00';
  const p95Duration = data.metrics.http_req_duration?.values?.['p(95)'] ? (data.metrics.http_req_duration.values['p(95)'] / 1000).toFixed(2) : '0.00';

  return {
    'stdout': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Teste Básico - 10 Usuários Simultâneos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Requisições Totais: ${totalReqs}
✅ Requisições Falhadas: ${failedReqs}
✅ Taxa de Sucesso: ${successRate}%
✅ Checks: ${checksPassed}/${checksTotal}
✅ Tempo Médio: ${avgDuration}s
✅ P95: ${p95Duration}s

${parseFloat(successRate) >= 80 ? '🎉 Teste PASSOU!' : '⚠️  Teste com problemas - Verifique Ollama e timeouts'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
    'k6-basic-results.json': JSON.stringify(data, null, 2),
  };
}
