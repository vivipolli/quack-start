# 🚀 Deploy no Railway - Guia Final

## ✅ Projeto Configurado

O projeto está **100% pronto** para deploy no Railway! 

### 📁 Arquivos de Configuração Criados:

- ✅ **`Procfile`** - Define o processo web
- ✅ **`railway.toml`** - Configuração do Railway
- ✅ **`nixpacks.toml`** - Build otimizado
- ✅ **`.env.example`** - Template de variáveis
- ✅ **`.gitignore`** - Arquivos excluídos
- ✅ **`DEPLOY.md`** - Documentação completa

### 🔧 Configuração Técnica:

- ✅ **Runtime**: Node.js + TypeScript (ts-node)
- ✅ **Health Check**: Endpoint `/` e `/health`
- ✅ **Port**: Configurado via `PORT` environment variable
- ✅ **Build**: Otimizado para produção

## 🚀 Passos para Deploy:

### 1. **Push para GitHub**
```bash
git add .
git commit -m "🚀 Railway deploy ready"
git push origin main
```

### 2. **Conectar no Railway**
1. Acesse [railway.app](https://railway.app)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha este repositório

### 3. **Configurar Variáveis**
No Railway Dashboard → Variables tab:

```bash
# OBRIGATÓRIAS
TELEGRAM_BOT_TOKEN=your_bot_token
OPENROUTER_API_KEY=your_openrouter_key

# OPCIONAIS (para scraper)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE_NUMBER=your_phone

# OPCIONAIS (para NFT)
NFT_CONTRACT_ADDRESS=your_contract
NFT_OWNER_PRIVATE_KEY=your_key

# CONFIGURAÇÃO
NODE_ENV=production
PORT=3000
```

### 4. **Deploy Automático**
- ✅ Railway detectará automaticamente o `package.json`
- ✅ Executará `npm install`
- ✅ Iniciará com `npm start`
- ✅ Health check em `/` e `/health`

## 🔍 Monitoramento:

### **Logs em Tempo Real:**
```bash
# No Railway Dashboard
Deployments → Latest → Logs
```

### **Health Check:**
```bash
# Teste o endpoint
curl https://your-app.railway.app/health
```

### **Métricas:**
- CPU, Memória, Rede
- Uptime e performance
- Logs estruturados

## 🛠️ Troubleshooting:

### **Build Errors:**
- Verifique se todas as dependências estão no `package.json`
- Confirme se o `ts-node` está instalado

### **Runtime Errors:**
- Verifique as variáveis de ambiente
- Confirme se o bot token é válido
- Verifique os logs no dashboard

### **Performance:**
- Railway escala automaticamente
- Monitor disponível no dashboard

## 📊 Status do Deploy:

### **✅ Pronto:**
- [x] Configuração TypeScript
- [x] Health check endpoint
- [x] Variáveis de ambiente
- [x] Build otimizado
- [x] Logs estruturados
- [x] Graceful shutdown

### **🎯 Próximos Passos:**
1. Push para GitHub
2. Conectar no Railway
3. Configurar variáveis
4. Deploy automático

## 💡 Dicas:

- **Free Tier**: $5 credit/mês
- **Auto-scaling**: Baseado no uso
- **Rollback**: Disponível no dashboard
- **Custom Domain**: Suportado

## 🆘 Suporte:

- [Railway Docs](https://docs.railway.app)
- [Discord Community](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp/railway/issues)

---

**🎉 Seu bot estará online em minutos!**
