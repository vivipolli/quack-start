module.exports = {
  solidity: "0.8.28", // or 0.8.9
  paths: {
    artifacts: "./src",
  },
  networks: {
    DuckChainTestnet: {
      url: `https://testnet-rpc.duckchain.io`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
  },
};