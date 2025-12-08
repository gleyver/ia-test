#!/bin/bash
# Testes simples e rápidos

echo "🧪 Testes Simples - Fase 1"
echo ""

# Teste 1: Health check
echo "1️⃣  Teste: Health Check"
curl -s http://localhost:3000/api/health | jq .
echo ""

# Teste 2: Query sem arquivo
echo "2️⃣  Teste: Query sem arquivo (deve usar conhecimento do modelo)"
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "O que é inteligência artificial?"}' \
  -s | jq -r '.response' | head -n 3
echo ""

# Teste 3: Criar arquivo de teste
echo "Este é um documento de teste. Contém informações sobre RAG (Retrieval-Augmented Generation)." > test.txt

# Teste 4: Query com arquivo
echo "3️⃣  Teste: Query com arquivo"
curl -X POST http://localhost:3000/api/query \
  -F "file=@test.txt" \
  -F "query=O que é RAG?" \
  -s | jq -r '.response' | head -n 3
echo ""

# Teste 5: Estatísticas de sessões
echo "4️⃣  Teste: Estatísticas de sessões"
curl -s http://localhost:3000/api/collection/info | jq .
echo ""

# Limpar
rm -f test.txt

echo "✅ Testes simples concluídos!"
