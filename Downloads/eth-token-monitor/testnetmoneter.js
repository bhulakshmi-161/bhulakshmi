// const { ethers, formatUnits } = require("ethers");
// const fs = require("fs");

// // Config
// const rpcUrl = "https://sepolia.infura.io/v3/fe6c6cbe5cec494b88337a35d29bec62";
// const tokenAddress = "0xE772385Eec8B7B25C586ce27435279A4Fb03CBBF";
// const tokenABI = [
//   "event Transfer(address indexed from, address indexed to, uint256 value)"
// ];

// const provider = new ethers.JsonRpcProvider(rpcUrl);
// const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

// // Load watchlist
// const rawData = fs.readFileSync("watchlist.json");
// const watchlist = new Set(JSON.parse(rawData).addresses.map(addr => addr.toLowerCase()));

// async function logTransferEvent(event) {
//   const { from, to, value } = event.args;
//   const fromLower = from.toLowerCase();
//   const toLower = to.toLowerCase();
//   const amount = formatUnits(value, 18);

//   if (watchlist.has(fromLower) || watchlist.has(toLower)) {
//     const block = await provider.getBlock(event.blockNumber);
//     console.log("🔔 Transfer involving watchlist:");
//     console.log({
//       txHash: event.transactionHash,
//       from,
//       to,
//       amount,
//       timestamp: new Date(block.timestamp * 1000).toISOString(),
//       blockNumber: event.blockNumber
//     });
//   }
// }

// async function main() {
//   // Define the start block for historical events, you can adjust this
//   const startBlock = 7761286;  // example block number to start scanning past events
//   const latestBlock = await provider.getBlockNumber();

//   console.log(`⏳ Fetching past Transfer events from block ${startBlock} to ${latestBlock}...`);
//   const pastEvents = await tokenContract.queryFilter("Transfer", startBlock, latestBlock);

//   console.log(`🔍 Found ${pastEvents.length} past Transfer events.`);

//   for (const event of pastEvents) {
//     await logTransferEvent(event);
//   }

//   console.log("🟢 Now listening for new Transfer events...");

//   // Listen to live Transfer events
//   tokenContract.on("Transfer", async (from, to, value, event) => {
//     // Wrap the event in an object with .args to reuse logTransferEvent
//     await logTransferEvent(event);
//   });
// }

// main().catch(console.error);



const { ethers, formatUnits } = require("ethers");
const fs = require("fs");
const axios = require("axios");

// Config
const rpcUrl = "https://sepolia.infura.io/v3/fe6c6cbe5cec494b88337a35d29bec62";
const tokenAddress = "0xE772385Eec8B7B25C586ce27435279A4Fb03CBBF";
const tokenABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];
const provider = new ethers.JsonRpcProvider(rpcUrl);
const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

// Load watchlist of 10,000 addresses from JSON file
const rawData = fs.readFileSync("watchlist.json");
const watchlist = new Set(JSON.parse(rawData).addresses.map(addr => addr.toLowerCase()));

// Your notification API endpoint (replace with your real API URL)
const NOTIFICATION_API_URL = "http://localhost:5000/notify"; // here we can write the notification api 


async function sendNotification(details) {
  try {
    const response = await axios.post(NOTIFICATION_API_URL, details);
    console.log("✅ Notification sent:", response.status);
  } catch (err) {
    console.error("❌ Failed to send notification:", err.message);
  }
}

// Function to handle and notify on matching transfer events
async function handleTransferEvent(event) {
  const { from, to, value } = event.args;
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  if (!watchlist.has(fromLower) && !watchlist.has(toLower)) {
    return; 
  }

  const amount = formatUnits(value, 18); 
  const block = await provider.getBlock(event.blockNumber);

  const txDetails = {
    txHash: event.transactionHash,
    from,
    to,
    amount,
    timestamp: new Date(block.timestamp * 1000).toISOString(),
    blockNumber: event.blockNumber,
  };

 
  console.log("🔔 Transfer involving watchlist address:", txDetails);

  // Send API notification (optional, comment out if not needed)
  await sendNotification(txDetails);
}

async function main() {
  // Fetch past events - optional (use your own start block)
  const startBlock = 8150000;
  const latestBlock = await provider.getBlockNumber();

  console.log(`⏳ Fetching past Transfer events from block ${startBlock} to ${latestBlock}...`);
  const pastEvents = await tokenContract.queryFilter("Transfer", startBlock, latestBlock);
  console.log(`🔍 Found ${pastEvents.length} past Transfer events.`);

  for (const event of pastEvents) {
    await handleTransferEvent(event);
  }

  console.log("🟢 Listening for new Transfer events...");

  tokenContract.on("Transfer", async (from, to, value, event) => {
    await handleTransferEvent(event);
  });
}

main().catch(console.error);

