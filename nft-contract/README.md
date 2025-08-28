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

### Deploy with Hardhat Ignition
```bash
# Deploy using the NFT-Reward module
npx hardhat ignition deploy ignition/modules/NFT-Reward.js --network sepolia

# Deploy with custom parameters
npx hardhat ignition deploy ignition/modules/NFT-Reward.js \
  --parameters vrfCoordinatorV2=0x50AE5Ea38517BD599b4848cbd1a792e94964d2a6 \
  --parameters subscriptionId=123 \
  --parameters gasLane=0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c \
  --parameters callbackGasLimit=500000 \
  --parameters initialOwner=0xYourOwnerAddress \
  --network sepolia
```

### Traditional Deploy
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Create Campaign (Owner Only)
```javascript
// Only the contract owner can create campaigns
await nftContract.createCampaign(
    "DuckChain Launch",  // Campaign name
    1000,                // Total NFTs
    700,                 // Common
    250,                 // Rare
    50,                  // Legendary
    30                   // Duration in days
);
```

## 📝 Uso do Contrato

### For Users
```javascript
// Request NFT with random rarity
const requestId = await nftContract.participateInCampaign();

// Listen to mint event
nftContract.on("NFTMinted", (to, tokenId, rarity) => {
    console.log(`NFT ${rarity} minted for ${to}`);
});
```

### For Platform
```javascript
// Check campaign status
const campaignStatus = await nftContract.getCampaignStatus();
console.log(`Campaign: ${campaignStatus.name}, Active: ${campaignStatus.active}`);

// Check if user already participated
const hasClaimed = await nftContract.hasClaimed(userAddress);
```



## 🎯 Casos de Uso

### **1. New User Onboarding**
- User registers on the platform
- Requests reward NFT
- Receives NFT with random rarity

### **2. Reward System**
- Active users receive rare NFTs
- Special events with Legendary NFTs
- Platform gamification

### **3. Community Art Ecosystem**
- Community artists create NFT artwork
- DUCK token reward system for creators
- Official representation of artwork by artists
- Incentive for active community participation

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

## 🎨 Metadados e Arte

Cada NFT inclui metadados on-chain com:
- **Nome**: Baseado na raridade (ex: "Golden Duck #123")
- **Descrição**: Informações sobre a coleção
- **Atributos**: Raridade, Token ID, Collection
- **Imagem**: URI para imagem do NFT

### **Community Art**
NFT artwork is created by the community, which engages the ecosystem, and these creators can receive DUCK tokens and also become representatives of the artwork. This serves as an incentive for network artists, promoting:

- **🎨 Community Creation**: Community artists create NFT artwork
- **💰 Token Incentives**: Creators receive DUCK tokens as rewards
- **🏆 Representation**: Artists become official representatives of the artwork
- **🌱 Engagement**: System encourages active community participation
- **🎯 Gamification**: Combines art, technology, and rewards

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
