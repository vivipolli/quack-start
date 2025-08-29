const { ethers } = require('ethers');

class CampanhaService {
    constructor() {
        this.campanhas = new Map();
        this.usuariosParticipantes = new Map();
    }

    /**
     * Verify if there is an active campaign (simulated - in production it would be verified in the contract)
     */
    getCampanhaAtiva() {
        // In production, this would be verified in the contract
        // For now, simulate an active campaign
        return {
            id: "1",
            nome: "DuckChain Launch",
            totalNFTs: 1000,
            mintados: 0,
            commonDisponivel: 700,
            rareDisponivel: 250,
            legendaryDisponivel: 50,
            ativa: true,
            dataInicio: new Date(),
            dataFim: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 dias
        };
    }

    /**
     * Verify if there is an active campaign
     */
    getCampanhaAtiva() {
        for (const [id, campanha] of this.campanhas) {
            if (campanha.ativa && new Date() <= campanha.dataFim && campanha.mintados < campanha.totalNFTs) {
                return campanha;
            }
        }
        return null;
    }

    /**
     * Verify if the user can participate
     */
    podeParticipar(userId) {
        const campanha = this.getCampanhaAtiva();
        if (!campanha) return { pode: false, motivo: "No active campaign" };
        
        if (this.usuariosParticipantes.has(userId)) {
            return { pode: false, motivo: "You have already participated in this campaign" };
        }

        if (campanha.mintados >= campanha.totalNFTs) {
            return { pode: false, motivo: "Campaign sold out" };
        }

        if (new Date() > campanha.dataFim) {
            return { pode: false, motivo: "Campaign expired" };
        }

        return { pode: true, campanha: campanha };
    }

    /**
     * Process participation in the campaign
     */
    async participarCampanha(userId) {
        const verificacao = this.podeParticipar(userId);
        
        if (!verificacao.pode) {
            return {
                success: false,
                message: verificacao.motivo
            };
        }

        const campanha = verificacao.campanha;
        
        // Mark user as participant
        this.usuariosParticipantes.set(userId, {
            campanhaId: campanha.id,
            dataParticipacao: new Date()
        });

        // Create wallet for the user
        const carteira = await this.criarCarteira(userId);

        return {
            success: true,
            campanha: campanha,
            carteira: carteira,
            message: `🎉 Participation confirmed in the campaign "${campanha.nome}"!\n\n💼 Your wallet: ${carteira.address}\n\n⏰ Wait for the rarity draw...`
        };
    }

    /**
    * Create a wallet for the user
     */
    async criarCarteira(userId) {
        const wallet = ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    }

    /**
     * Return the status of the current campaign
     */
    getStatusCampanha() {
        const campanha = this.getCampanhaAtiva();
        if (!campanha) {
            return {
                ativa: false,
                message: "No active campaign at the moment"
            };
        }

        const restantes = campanha.totalNFTs - campanha.mintados;
        const diasRestantes = Math.ceil((campanha.dataFim - new Date()) / (24 * 60 * 60 * 1000));

        return {
            ativa: true,
            nome: campanha.nome,
            mintados: campanha.mintados,
            total: campanha.totalNFTs,
            restantes: restantes,
            diasRestantes: diasRestantes,
            message: `🎯 Campanha: ${campanha.nome}\n\n📊 Progresso: ${campanha.mintados}/${campanha.totalNFTs} NFTs\n⏰ Restam: ${diasRestantes} dias\n🎁 Disponíveis: ${restantes} NFTs`
        };
    }

    /**
     * Finalize a campaign
     */
    finalizarCampanha(campanhaId) {
        const campanha = this.campanhas.get(campanhaId);
        if (campanha) {
            campanha.ativa = false;
            console.log(`Campanha finalizada: ${campanha.nome} - ${campanha.mintados} NFTs mintados`);
        }
    }
}

module.exports = { CampanhaService };
