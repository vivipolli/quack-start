const { ethers } = require('ethers');

class CampanhaService {
    constructor() {
        this.campanhas = new Map();
        this.usuariosParticipantes = new Map();
    }

    /**
     * Verifica se há campanha ativa (simulado - em produção seria do contrato)
     */
    getCampanhaAtiva() {
        // Em produção, isso seria verificado no contrato
        // Por enquanto, simula uma campanha ativa
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
     * Verifica se há campanha ativa
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
     * Verifica se usuário pode participar
     */
    podeParticipar(userId) {
        const campanha = this.getCampanhaAtiva();
        if (!campanha) return { pode: false, motivo: "Nenhuma campanha ativa" };
        
        if (this.usuariosParticipantes.has(userId)) {
            return { pode: false, motivo: "Você já participou desta campanha" };
        }

        if (campanha.mintados >= campanha.totalNFTs) {
            return { pode: false, motivo: "Campanha esgotada" };
        }

        if (new Date() > campanha.dataFim) {
            return { pode: false, motivo: "Campanha expirada" };
        }

        return { pode: true, campanha: campanha };
    }

    /**
     * Processa participação na campanha
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
        
        // Marca usuário como participante
        this.usuariosParticipantes.set(userId, {
            campanhaId: campanha.id,
            dataParticipacao: new Date()
        });

        // Cria carteira para o usuário
        const carteira = await this.criarCarteira(userId);

        return {
            success: true,
            campanha: campanha,
            carteira: carteira,
            message: `🎉 Participação confirmada na campanha "${campanha.nome}"!\n\n💼 Sua carteira: ${carteira.address}\n\n⏰ Aguarde o sorteio da raridade...`
        };
    }

    /**
     * Cria uma carteira para o usuário
     */
    async criarCarteira(userId) {
        const wallet = ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    }

    /**
     * Retorna status da campanha atual
     */
    getStatusCampanha() {
        const campanha = this.getCampanhaAtiva();
        if (!campanha) {
            return {
                ativa: false,
                message: "Nenhuma campanha ativa no momento"
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
     * Finaliza uma campanha
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
