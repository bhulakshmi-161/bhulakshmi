require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {}, // Default Hardhat network
    localhost: {
      url: "http://localhost:8545", // Localhost network
      accounts: [process.env.PRIVATE_KEY] // Use your private key for deploying
    }
  }
};
