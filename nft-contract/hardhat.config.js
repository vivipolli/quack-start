module.exports = {
  solidity: "0.8.28", // or 0.8.9
  paths: {
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    DuckChainTestnet: {
      url: "https://testnet-rpc.duckchain.io",
      chainId: 202105,
      accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
    },
    DuckChainMainnet: {
      url: "https://rpc.duckchain.io",
      chainId: 5545,
      accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
    },
  },
};