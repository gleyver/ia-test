/**
 * Teste de Spike - Picos súbitos de tráfego
 * Simula situações reais de pico de uso
 */

import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal: 10 usuários
    { duration: '10s', target: 500 },   // SPIKE: 500 usuários!
    { duration: '30s', target: 500 },  // Manter spike
    { duration: '10s', target: 10 },    // Voltar ao normal
    { duration: '30s', target: 10 },    // Normal
    { duration: '10s', target: 300 },    // SPIKE: 300 usuários
    { duration: '20s', target: 300 },   // Manter spike
    { duration: '10s', target: 10 },    // Voltar ao normal
  ],
  thresholds: {
    http_req_duration: ['p(95)<15000'], // 95% < 15s
    http_req_failed: ['rate<0.15'],      // Taxa de erro < 15% (spike é agressivo)
    checks: ['rate>0.75'],               // 75% dos checks passam
  },
};

export default function () {
  const uniqueId = randomString(8);

  // Query simples (sem arquivo para ser mais rápido)
  const queryRes = http.post(
    `${BASE_URL}/api/query`,
    JSON.stringify({
      query: `Pergunta ${uniqueId}: Explique inteligência artificial de forma breve.`,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '20s',
    }
  );

  check(queryRes, {
    'status is 200': (r) => r.status === 200,
    'has success response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
    'response time acceptable': (r) => r.timings.duration < 20000,
  });

  sleep(Math.random() * 1 + 0.5); // Sleep curto entre 0.5-1.5s
}

export function handleSummary(data) {
  return {
    'stdout': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Teste de Spike - Picos de Tráfego
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Requisições: ${data.metrics.http_reqs.values.count}
📊 Taxa de Erro: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
📊 Tempo Médio: ${(data.metrics.http_req_duration.values.avg / 1000).toFixed(2)}s
📊 P95: ${(data.metrics.http_req_duration.values['p(95)'] / 1000).toFixed(2)}s

${data.metrics.http_req_failed.values.rate < 0.15 ? '✅ Sistema lidou bem com os spikes!' : '⚠️  Sistema teve dificuldades com spikes'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
    'k6-spike-results.json': JSON.stringify(data, null, 2),
  };
}
