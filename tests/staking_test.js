const {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  TransactionInstruction,
} = require('@solana/web3.js');
const {
  Token,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const BN = require('bn.js');

// Replace these with your own values
const STAKING_PROGRAM_ID = new PublicKey('enter the program id ');
const STAKING_VAULT = new PublicKey('staking valut public key');

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Function to initialize the staking account
async function initializeStaking(userKeypair) {
  const stakingAccount = Keypair.generate();

  const transaction = new Transaction();

  // Define the initialize instruction
  const initializeInstruction = new TransactionInstruction({
    keys: [
      { pubkey: stakingAccount.publicKey, isSigner: true, isWritable: true },
      { pubkey: userKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: STAKING_VAULT, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: STAKING_PROGRAM_ID,
    data: Buffer.from(Uint8Array.of(0)), // 0 for Initialize instruction
  });

  transaction.add(initializeInstruction);

  // Send the transaction
  await sendAndConfirmTransaction(connection, transaction, [userKeypair, stakingAccount]);

  return stakingAccount.publicKey;
}

// Function to stake tokens
async function stakeTokens(userKeypair, userTokenAccount, amount, duration) {
  const transaction = new Transaction();

  // Define the stake instruction
  const stakeInstruction = new TransactionInstruction({
    keys: [
      { pubkey: userKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: STAKING_VAULT, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: STAKING_PROGRAM_ID,
    data: Buffer.from(Uint8Array.of(1, ...new BN(amount).toArray('le', 8), ...new BN(duration).toArray('le', 8))), // 1 for Stake instruction
  });

  transaction.add(stakeInstruction);

  // Send the transaction
  await sendAndConfirmTransaction(connection, transaction, [userKeypair]);
}

// Function to withdraw staked tokens
async function withdrawTokens(userKeypair, userTokenAccount) {
  const transaction = new Transaction();

  // Define the withdraw instruction
  const withdrawInstruction = new TransactionInstruction({
    keys: [
      { pubkey: userKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: STAKING_VAULT, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: STAKING_PROGRAM_ID,
    data: Buffer.from(Uint8Array.of(2)), // 2 for Withdraw instructions
  });

  transaction.add(withdrawInstruction);

  // Send the transaction
  await sendAndConfirmTransaction(connection, transaction, [userKeypair]);
}

// Example 
(async () => {
  const userKeypair = Keypair.generate(); // Replace with your keypair
  const userTokenAccount = new PublicKey('useer token public key'); // Replace with your token account

  // Initialize staking account
  const stakingAccount = await initializeStaking(userKeypair);

  // Stake 100 tokens for 30 days
  await stakeTokens(userKeypair, userTokenAccount, 100, 30);

  // Withdraw tokens after the staking period
  await withdrawTokens(userKeypair, userTokenAccount);
})();
