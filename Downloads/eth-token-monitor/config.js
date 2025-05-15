module.exports = {
  // rpcUrl: "wss://mainnet.infura.io/ws/v3/56d62982b2a448198397da9477afdce3",
    rpcUrl: "https://sepolia.infura.io/v3/fe6c6cbe5cec494b88337a35d29bec62",

  // tokenAddress: "0xF977814e90dA44bFA03b6295A0616a897441aceC", 
  tokenAddress: "0xE772385Eec8B7B25C586ce27435279A4Fb03CBBF",             // ERC-20 token to monitor
  tokenABI: [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ]
};
