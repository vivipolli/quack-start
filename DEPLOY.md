# 🚀 Deploy no Railway

## 📋 Pré-requisitos

1. **Conta no Railway**: [railway.app](https://railway.app)
2. **GitHub Repository**: Código deve estar em um repositório público ou privado
3. **Variáveis de Ambiente**: Configuradas conforme `.env.example`

## 🔧 Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no Railway:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# OpenRouter AI
OPENROUTER_API_KEY=your_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Telegram Scraper (opcional)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE_NUMBER=your_phone

# DuckChain
DUCKCHAIN_RPC_URL=https://mainnet.duckchain.io
DUCKCHAIN_CHAIN_ID=1

# NFT Contract (opcional)
NFT_CONTRACT_ADDRESS=your_contract_address
NFT_OWNER_PRIVATE_KEY=your_private_key

# Environment
NODE_ENV=production
```

### 2. Deploy Steps

1. **Conecte o Repository**:
   - Vá para [railway.app](https://railway.app)
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha este repositório

2. **Configure as Variáveis**:
   - Vá em "Variables" tab
   - Adicione todas as variáveis do `.env.example`

3. **Deploy**:
   - Railway detectará automaticamente o `package.json`
   - Executará `npm install` e `npm run build`
   - Iniciará com `npm start`

## 📁 Estrutura de Arquivos

```
├── Procfile              # Railway process definition
├── railway.json          # Railway configuration
├── nixpacks.toml         # Build configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
└── dist/                # Build output (auto-generated)
```

## 🔍 Troubleshooting

### Build Errors
- Verifique se todas as dependências estão no `package.json`
- Confirme se o `tsconfig.json` está configurado corretamente

### Runtime Errors
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme se o bot token é válido
- Verifique os logs no Railway dashboard

### Performance
- O Railway automaticamente escala baseado no uso
- Monitor de recursos disponível no dashboard

## 📊 Monitoramento

- **Logs**: Acesse via Railway dashboard
- **Métricas**: CPU, memória e rede disponíveis
- **Health Check**: Configurado para `/` endpoint

## 🔄 CI/CD

O Railway suporta:
- Deploy automático em push para `main`
- Preview deployments em pull requests
- Rollback para versões anteriores

## 💰 Custos

- **Free Tier**: $5 credit/mês
- **Pro**: $20/mês para uso ilimitado
- **Enterprise**: Contato direto

## 🆘 Suporte

- [Railway Docs](https://docs.railway.app)
- [Discord Community](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp/railway/issues)
