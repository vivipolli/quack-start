// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("NFTRewardModule", (m) => {
  // Chainlink VRF Configuration Parameters
  const vrfCoordinatorV2 = m.getParameter("vrfCoordinatorV2", "0x50AE5Ea38517BD599b4848cbd1a792e94964d2a6"); // Sepolia Testnet
  const subscriptionId = m.getParameter("subscriptionId", "1"); // Your Chainlink VRF subscription ID
  const gasLane = m.getParameter("gasLane", "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"); // Sepolia Testnet
  const callbackGasLimit = m.getParameter("callbackGasLimit", "500000"); // Gas limit for callback
  const initialOwner = m.getParameter("initialOwner", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"); // Initial contract owner

  // Deploy the QuackStart NFT contract
  const quackStartNFT = m.contract("QuackStart", [
    initialOwner,
    vrfCoordinatorV2,
    subscriptionId,
    gasLane,
    callbackGasLimit
  ]);

  return { quackStartNFT };
});
