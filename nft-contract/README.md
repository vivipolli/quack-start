# 🦆 DuckChain Reward NFT Contract

Um contrato NFT ERC-721 para recompensar novos usuários da plataforma DuckChain com NFTs de diferentes raridades, integrado com Chainlink VRF para aleatoriedade verificável.

## 📋 Características

- **Padrão ERC-721**: Compatível com todas as marketplaces e wallets
- **Chainlink VRF**: Aleatoriedade verificável e descentralizada
- **Sistema de Raridade**: 3 níveis (Common, Rare, Legendary)
- **One-Time Claim**: Cada endereço pode reivindicar apenas uma vez
- **Integração Telegram**: Otimizado para usuários do Telegram

## 🎲 Sistema de Raridade

| Raridade | Chance | Descrição | Benefícios |
|----------|--------|-----------|------------|
| **Common** | 90% | NFT padrão para novos usuários | Acesso básico à plataforma |
| **Rare** | 9% | NFT rara com valor moderado | **AI Tools Premium** + Community Benefits |
| **Legendary** | 1% | NFT lendária com máximo valor | **AI Tools Premium** + Community Benefits + Governança |

## 🎲 Sistema de Raridade

| Raridade | Chance | Descrição |
|----------|--------|-----------|
| **Common** | 90% | NFT padrão para novos usuários |
| **Rare** | 9% | NFT rara com valor moderado |
| **Legendary** | 1% | NFT lendária com máximo valor |

## 🏗️ Arquitetura Técnica

### **Chainlink VRF Integration**
```solidity
// Request random number
function requestRarityNFT() external returns (uint256 requestId)

// Callback with verified randomness
function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override
```

### **Sistema de Raridade**
```solidity
function _determineRarity(uint256 randomNumber) internal pure returns (string memory) {
    if (randomNumber < 1) return "LEGENDARY";    // 1%
    if (randomNumber < 10) return "RARE";       // 9%
    return "COMMON";                            // 90%
}
```

## 🚀 Deploy

### Pré-requisitos
```bash
npm install @openzeppelin/contracts @chainlink/contracts
```

### Configuração Chainlink VRF
```javascript
// Sepolia Testnet
const VRF_COORDINATOR = "0x50AE5Ea38517BD599b4848cbd1a792e94964d2a6";
const SUBSCRIPTION_ID = "your_subscription_id";
const GAS_LANE = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
const CALLBACK_GAS_LIMIT = 500000;
```

### Deploy
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Criar Campanha (Apenas Owner)
```javascript
// Apenas o owner do contrato pode criar campanhas
await nftContract.criarCampanha(
    "DuckChain Launch",  // Nome da campanha
    1000,                // Total de NFTs
    700,                 // Common
    250,                 // Rare
    50,                  // Legendary
    30                   // Duração em dias
);
```

## 📝 Uso do Contrato

### Para Usuários
```javascript
// Solicitar NFT com raridade aleatória
const requestId = await nftContract.requestRarityNFT();

// Escutar evento de mint
nftContract.on("NFTMinted", (to, tokenId, rarity) => {
    console.log(`NFT ${rarity} mintado para ${to}`);
});
```

### Para a Plataforma
```javascript
// Verificar raridade de um NFT
const nftInfo = await nftContract.getNFTInfo(tokenId);
console.log(`NFT ${tokenId} é ${nftInfo.rarity}`);

// Verificar se usuário já reivindicou
const hasClaimed = await nftContract.hasClaimed(userAddress);
```



## 🎯 Casos de Uso

### **1. Onboarding de Novos Usuários**
- Usuário se registra na plataforma
- Solicita NFT de recompensa
- Recebe NFT com raridade aleatória

### **2. Sistema de Recompensas**
- Usuários ativos recebem NFTs raros
- Eventos especiais com NFTs Legendary
- Gamificação da plataforma

## 🔍 Eventos

### NFTMinted
```javascript
nftContract.on("NFTMinted", (to, tokenId, rarity) => {
    // Notificar usuário sobre seu NFT
    // Desbloquear benefícios baseados na raridade
    // Atualizar interface do usuário
});
```

## 🛡️ Segurança

- **Chainlink VRF**: Aleatoriedade verificável e descentralizada
- **One-Time Claim**: Previne múltiplas reivindicações
- **Owner Controls**: Apenas owner pode configurar parâmetros
- **Request Validation**: Verificação de requests válidos

## 📊 Estatísticas

```javascript
const stats = await nftContract.getContractStats();
console.log(`Total mintado: ${stats.totalMinted}`);
console.log(`Max supply: ${stats.maxSupply}`);
```

## 🎨 Metadados

Cada NFT inclui metadados on-chain com:
- **Nome**: Baseado na raridade (ex: "Golden Duck #123")
- **Descrição**: Informações sobre a coleção
- **Atributos**: Raridade, Token ID, Collection
- **Imagem**: URI para imagem do NFT

## 🔮 Roadmap

### **Fase 1: Deploy e Integração**
- [x] Contrato NFT com VRF
- [x] Sistema de raridade
- [ ] Integração com bot Telegram
- [ ] Deploy em mainnet

### **Fase 2: Benefícios e Utilidade**
- [ ] AI Tools Premium para NFTs raros
- [ ] Community Benefits implementados
- [ ] Sistema de governança
- [ ] Integração StarFi

### **Fase 3: Expansão**
- [ ] Marketplace de NFTs
- [ ] Sistema de staking
- [ ] Eventos especiais
- [ ] Parcerias e integrações

## 📞 Suporte

Para dúvidas sobre o contrato ou integração:
- **Documentação**: Este README
- **Issues**: GitHub repository
- **Telegram**: @DuckChainSupport

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

---

**DuckChain: The Telegram AI Chain** 🦆✨
*Empowering 1 billion+ Telegram users with AI-driven Web3 solutions*
