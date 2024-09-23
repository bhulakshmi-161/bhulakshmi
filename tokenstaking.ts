import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
  import { TOKEN_PROGRAM_ID, } from '@solana/spl-token';
  import { Buffer } from 'buffer';
  
  // Define the staking instruction types
  const STAKE_INSTRUCTION = 0;
  const UNSTAKE_INSTRUCTION = 1;
  
  // Function to stake tokens
  async function stakeTokens(
    connection: Connection,
    payer: Keypair,
    stakingAccountPubkey: PublicKey,
    userAccountPubkey: PublicKey,
    tokenAccountPubkey: PublicKey,
    amount: number,
    programId: PublicKey
  ) {
    const instructionData = Buffer.alloc(9);
    instructionData.writeUInt8(STAKE_INSTRUCTION, 0);
    instructionData.writeBigUInt64LE(BigInt(amount), 1);
  
    const transaction = new Transaction().add({
        keys: [
            { pubkey: stakingAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: userAccountPubkey, isSigner: true, isWritable: true },
            { pubkey: tokenAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  
        ],
        programId,
        data: instructionData,
    });
  
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    console.log('Stake transaction signature:', signature);
  }
  
  // Function to unstake tokens
  // async function unstakeTokens(
  //   connection: Connection,
  //   payer: Keypair,
  //   stakingAccountPubkey: PublicKey,
  //   userAccountPubkey: PublicKey,
  //   tokenAccountPubkey: PublicKey,
  //   programId: PublicKey
  // ) {
  //   const instructionData = Buffer.alloc(1);
  //   instructionData.writeUInt8(UNSTAKE_INSTRUCTION, 0);
  
  //   const transaction = new Transaction().add({
  //       keys: [
  //           { pubkey: stakingAccountPubkey, isSigner: false, isWritable: true },
  //           { pubkey: userAccountPubkey, isSigner: true, isWritable: true },
  //           { pubkey: tokenAccountPubkey, isSigner: false, isWritable: true },
              //  { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  
  //       ],
  //       programId,
  //       data: instructionData,
  //   });
  
  //   const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  //   console.log('Unstake transaction signature:', signature);
  // }
  
  // Example usage
  (async () => {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const payer = Keypair.fromSecretKey(new Uint8Array([110,148,101,43,68,224,191,58,214,149,24,35,232,92,178,182,189,215,60,186,160,72,160,161,228,23,169,47,101,30,51,164,161,69,10,78,143,157,61,30,171,68,95,19,184,207,213,128,5,202,23,24,224,109,11,165,33,217,167,126,177,82,76,23]
  
    )); // Replace with your payer's Keypair
    const stakingAccountPubkey = new PublicKey('8FbgJjkWobrVBgTFM1aoMhCYp6TZ21ymuNvZHdJctRRd'); // Replace with your staking account public key
    const userAccountPubkey = new PublicKey('BrXhY67ZAei7KsdYF6EDucLAK98ibMLvcNDitGS392Mk'); // Replace with your user account public key
    const tokenAccountPubkey = new PublicKey('8b2rE9hcUJjEaMGN8XEoS9vEbGQPc38VKR1bk34x1xxw'); // Replace with your token account public key
    const programId = new PublicKey('6PoJTdCNMpKKQU6xPRB2fubDJHE42zyJDRfbp6W2cJBQ'); // Replace with your program's public key
  
    // Stake tokens
    await stakeTokens(connection, payer, stakingAccountPubkey, userAccountPubkey, tokenAccountPubkey, 100, programId);
  
    // Unstake tokens
    // await unstakeTokens(connection, payer, stakingAccountPubkey, userAccountPubkey, tokenAccountPubkey, programId);
  })();
  