// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract QuackStart is ERC721, Ownable, VRFConsumerBaseV2 {
    uint256 private _nextTokenId;

    // Chainlink VRF
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Current campaign
    struct Campaign {
        string name;
        uint256 totalNFTs;
        uint256 minted;
        uint256 commonAvailable;
        uint256 rareAvailable;
        uint256 legendaryAvailable;
        bool active;
        uint256 startDate;
        uint256 endDate;
    }

    Campaign public currentCampaign;
    mapping(uint256 => address) public s_rarityRequests;
    mapping(address => bool) public hasClaimed;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string rarity);
    event CampaignCreated(
        string name,
        uint256 totalNFTs,
        uint256 startDate,
        uint256 endDate
    );
    event CampaignFinalized(string name, uint256 totalMinted);

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

    function createCampaign(
        string memory name,
        uint256 totalNFTs,
        uint256 common,
        uint256 rare,
        uint256 legendary,
        uint256 durationDays
    ) external onlyOwner {
        require(
            totalNFTs == common + rare + legendary,
            "Total must equal sum of rarities"
        );
        require(
            currentCampaign.active == false,
            "Current campaign still active"
        );

        currentCampaign = Campaign({
            name: name,
            totalNFTs: totalNFTs,
            minted: 0,
            commonAvailable: common,
            rareAvailable: rare,
            legendaryAvailable: legendary,
            active: true,
            startDate: block.timestamp,
            endDate: block.timestamp + (durationDays * 1 days)
        });

        emit CampaignCreated(
            name,
            totalNFTs,
            currentCampaign.startDate,
            currentCampaign.endDate
        );
    }

    function participateInCampaign() external returns (uint256 requestId) {
        require(currentCampaign.active, "No active campaign");
        require(block.timestamp <= currentCampaign.endDate, "Campaign expired");
        require(
            currentCampaign.minted < currentCampaign.totalNFTs,
            "Campaign sold out"
        );
        require(!hasClaimed[msg.sender], "Already participated in campaign");

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
        require(user != address(0), "Request not found");
        require(!hasClaimed[user], "User already participated");

        string memory rarity = _determineRarity(randomWords[0]);

        hasClaimed[user] = true;
        currentCampaign.minted++;

        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);

        emit NFTMinted(user, tokenId, rarity);
    }

    function _determineRarity(
        uint256 randomNumber
    ) internal returns (string memory) {
        uint256 total = currentCampaign.commonAvailable +
            currentCampaign.rareAvailable +
            currentCampaign.legendaryAvailable;
        uint256 random = randomNumber % total;

        if (random < currentCampaign.legendaryAvailable) {
            currentCampaign.legendaryAvailable--;
            return "LEGENDARY";
        } else if (
            random <
            currentCampaign.legendaryAvailable + currentCampaign.rareAvailable
        ) {
            currentCampaign.rareAvailable--;
            return "RARE";
        } else {
            currentCampaign.commonAvailable--;
            return "COMMON";
        }
    }

    function finalizeCampaign() external onlyOwner {
        require(currentCampaign.active, "No active campaign");
        currentCampaign.active = false;
        emit CampaignFinalized(currentCampaign.name, currentCampaign.minted);
    }

    function getCampaignStatus()
        external
        view
        returns (
            string memory name,
            uint256 totalNFTs,
            uint256 minted,
            uint256 commonAvailable,
            uint256 rareAvailable,
            uint256 legendaryAvailable,
            bool active,
            uint256 endDate
        )
    {
        return (
            currentCampaign.name,
            currentCampaign.totalNFTs,
            currentCampaign.minted,
            currentCampaign.commonAvailable,
            currentCampaign.rareAvailable,
            currentCampaign.legendaryAvailable,
            currentCampaign.active,
            currentCampaign.endDate
        );
    }
}
