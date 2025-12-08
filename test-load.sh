#!/bin/bash
# Script de teste de carga - 100 requisições simultâneas

echo "🚀 Iniciando teste de carga: 100 requisições simultâneas"
echo "📊 Servidor deve estar rodando em http://localhost:3000"
echo ""

# Criar arquivo de teste simples
echo "Este é um documento de teste para o sistema RAG. Contém informações sobre inteligência artificial, machine learning e processamento de linguagem natural." > test-doc.txt

# Contador de sucessos e falhas
SUCCESS=0
FAIL=0

# Executar 100 requisições em paralelo
echo "📤 Enviando 100 requisições..."
for i in {1..100}; do
  (
    HTTP_CODE=$(curl -X POST http://localhost:3000/api/query \
      -F "file=@test-doc.txt" \
      -F "query=Pergunta $i: Qual é o conteúdo do documento?" \
      -w "%{http_code}" \
      -s -o /dev/null)

    if [ "$HTTP_CODE" -eq 200 ]; then
      echo "✅ Requisição $i: Sucesso (HTTP $HTTP_CODE)"
      echo "SUCCESS" >> /tmp/rag-test-results.txt
    else
      echo "❌ Requisição $i: Falha (HTTP $HTTP_CODE)"
      echo "FAIL" >> /tmp/rag-test-results.txt
    fi
  ) &
done

# Aguardar todas as requisições completarem
wait

# Contar resultados
if [ -f /tmp/rag-test-results.txt ]; then
  SUCCESS=$(grep -c "SUCCESS" /tmp/rag-test-results.txt)
  FAIL=$(grep -c "FAIL" /tmp/rag-test-results.txt)
  rm /tmp/rag-test-results.txt
fi

echo ""
echo "📊 Resultados:"
echo "   ✅ Sucessos: $SUCCESS/100"
echo "   ❌ Falhas: $FAIL/100"
echo ""

# Limpar arquivo de teste
rm -f test-doc.txt

if [ "$FAIL" -eq 0 ]; then
  echo "🎉 Todos os testes passaram!"
  exit 0
else
  echo "⚠️  Alguns testes falharam. Verifique os logs do servidor."
  exit 1
fi
