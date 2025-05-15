const { ethers, formatUnits } = require("ethers");
const fs = require("fs");
const { rpcUrl, tokenAddress, tokenABI } = require("./config");
// const abi = require("../eth-token-monitor/rettokenabi.json");

// Load watchlist
const rawData = fs.readFileSync("watchlist.json");
const watchlist = new Set(JSON.parse(rawData).addresses.map(addr => addr.toLowerCase()));

const provider = new ethers.WebSocketProvider(rpcUrl);

const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

console.log("🟢 Monitoring token transfers...");

tokenContract.on("Transfer", async (from, to, value, event) => {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  console.log("the fromlower is", fromLower);
  console.log("the tolower is", toLower);

  // Use formatUnits imported directly
  const amount = formatUnits(value, 6);

  console.log("the amount is", amount);

  if (watchlist.has(fromLower) || watchlist.has(toLower)) {
    const txHash = event.transactionHash;
    console.log("the tx is", txHash);
    const timestamp = await provider.getBlock(event.blockNumber).then(block => block.timestamp);
    console.log("the timestamp is", timestamp);
    const logEntry = {
      txHash,
      from,
      to,
      amount,
      timestamp: new Date(timestamp * 1000).toISOString()
    };

    console.log("🔔 Token Transfer Involving Watchlist:");
    console.log(logEntry);
  }
});
