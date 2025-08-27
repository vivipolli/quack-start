// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract QuackStart is ERC721, Ownable, VRFConsumerBaseV2 {
    using Counters for Counters.Counter;

    uint256 private _nextTokenId;

    // Chainlink VRF
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Campanha atual
    struct Campanha {
        string nome;
        uint256 totalNFTs;
        uint256 mintados;
        uint256 commonDisponivel;
        uint256 rareDisponivel;
        uint256 legendaryDisponivel;
        bool ativa;
        uint256 dataInicio;
        uint256 dataFim;
    }

    Campanha public campanhaAtual;
    mapping(uint256 => address) public s_rarityRequests;
    mapping(address => bool) public hasClaimed;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string rarity);
    event CampanhaCriada(
        string nome,
        uint256 totalNFTs,
        uint256 dataInicio,
        uint256 dataFim
    );
    event CampanhaFinalizada(string nome, uint256 totalMintados);

    constructor(
        address initialOwner,
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit
    )
        ERC721("QuackStart", "QST")
        Ownable(initialOwner)
        VRFConsumerBaseV2(vrfCoordinatorV2)
    {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
    }

    function criarCampanha(
        string memory nome,
        uint256 totalNFTs,
        uint256 common,
        uint256 rare,
        uint256 legendary,
        uint256 duracaoDias
    ) external onlyOwner {
        require(
            totalNFTs == common + rare + legendary,
            "Total deve ser igual a soma das raridades"
        );
        require(campanhaAtual.ativa == false, "Campanha atual ainda ativa");

        campanhaAtual = Campanha({
            nome: nome,
            totalNFTs: totalNFTs,
            mintados: 0,
            commonDisponivel: common,
            rareDisponivel: rare,
            legendaryDisponivel: legendary,
            ativa: true,
            dataInicio: block.timestamp,
            dataFim: block.timestamp + (duracaoDias * 1 days)
        });

        emit CampanhaCriada(
            nome,
            totalNFTs,
            campanhaAtual.dataInicio,
            campanhaAtual.dataFim
        );
    }

    function participarCampanha() external returns (uint256 requestId) {
        require(campanhaAtual.ativa, "Nenhuma campanha ativa");
        require(block.timestamp <= campanhaAtual.dataFim, "Campanha expirada");
        require(
            campanhaAtual.mintados < campanhaAtual.totalNFTs,
            "Campanha esgotada"
        );
        require(!hasClaimed[msg.sender], "Ja participou da campanha");

        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        s_rarityRequests[requestId] = msg.sender;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address user = s_rarityRequests[requestId];
        require(user != address(0), "Request nao encontrado");
        require(!hasClaimed[user], "Usuario ja participou");

        string memory rarity = _determinarRaridade(randomWords[0]);

        hasClaimed[user] = true;
        campanhaAtual.mintados++;

        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);

        emit NFTMinted(user, tokenId, rarity);
    }

    function _determinarRaridade(
        uint256 randomNumber
    ) internal view returns (string memory) {
        uint256 total = campanhaAtual.commonDisponivel +
            campanhaAtual.rareDisponivel +
            campanhaAtual.legendaryDisponivel;
        uint256 random = randomNumber % total;

        if (random < campanhaAtual.legendaryDisponivel) {
            campanhaAtual.legendaryDisponivel--;
            return "LEGENDARY";
        } else if (
            random <
            campanhaAtual.legendaryDisponivel + campanhaAtual.rareDisponivel
        ) {
            campanhaAtual.rareDisponivel--;
            return "RARE";
        } else {
            campanhaAtual.commonDisponivel--;
            return "COMMON";
        }
    }

    function finalizarCampanha() external onlyOwner {
        require(campanhaAtual.ativa, "Nenhuma campanha ativa");
        campanhaAtual.ativa = false;
        emit CampanhaFinalizada(campanhaAtual.nome, campanhaAtual.mintados);
    }

    function getStatusCampanha()
        external
        view
        returns (
            string memory nome,
            uint256 totalNFTs,
            uint256 mintados,
            uint256 commonDisponivel,
            uint256 rareDisponivel,
            uint256 legendaryDisponivel,
            bool ativa,
            uint256 dataFim
        )
    {
        return (
            campanhaAtual.nome,
            campanhaAtual.totalNFTs,
            campanhaAtual.mintados,
            campanhaAtual.commonDisponivel,
            campanhaAtual.rareDisponivel,
            campanhaAtual.legendaryDisponivel,
            campanhaAtual.ativa,
            campanhaAtual.dataFim
        );
    }
}
