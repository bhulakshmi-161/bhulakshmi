# Ethereum Token Transfer Monitor

Monitors a specific ERC-20 token for `Transfer` events involving any of 10,000 addresses.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your watchlist to `watchlist.json`.
3. Set your Infura/Alchemy RPC and token address in `config.js`.

## Run

```bash
npm start
```

## Output

Logs to the console:

```
🔔 Token Transfer Involving Watchlist:
{
  txHash: '0x...',
  from: '0x...',
  to: '0x...',
  amount: '1000000000000000000',
  timestamp: '2025-05-14T12:00:00.000Z'
}
```

You can redirect output to a file:

```bash
npm start >> logs.txt
```
