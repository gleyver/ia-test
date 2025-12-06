# 🚀 Instruções para Push no GitHub

## ✅ Repositório Configurado

O repositório local está conectado ao GitHub:

- **Remote**: `git@github.com:gleyver/ia-test.git`
- **Branch**: `master`

## 📝 Primeiro Commit e Push

### 1. Adicionar todos os arquivos:

```bash
git add .
```

### 2. Fazer commit (usando interface interativa):

```bash
npm run commit
```

Ou manualmente:

```bash
git commit -m "feat: initial commit - sistema RAG completo"
```

### 3. Fazer push para o GitHub:

```bash
git push -u origin master
```

## 🔄 Próximos Commits

Depois do primeiro push, você pode usar normalmente:

```bash
# Adicionar mudanças
git add .

# Commit com sugestão automática
npm run commit

# Push
git push
```

## 🔐 Autenticação SSH

Certifique-se de que sua chave SSH está configurada no GitHub:

```bash
# Testar conexão SSH
ssh -T git@github.com
```

Se não estiver configurada, veja: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
