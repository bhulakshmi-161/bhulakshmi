import {
    Connection,
    PublicKey,
    Transaction,
    Keypair,
    clusterApiUrl,
    SystemProgram,
    StakeProgram,
    sendAndConfirmTransaction
  } from "@solana/web3.js";
  import {
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  
  const findProgramAddress = async (
    programId: PublicKey,
    userPublicKey: PublicKey
  ) => {
    return await PublicKey.findProgramAddress(
      [userPublicKey.toBuffer()],
      programId
    );
  };
  
  // Example function to stake tokens
  async function stakeTokens(stakeAmount: number, mint: PublicKey) {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
    // Fetch user's wallet public key
    const wallet = Keypair.fromSecretKey(
      Uint8Array.from([
        109, 197, 16, 57, 107, 45, 107, 56, 233, 120, 83, 197, 238, 173, 211, 212,
        242, 182, 66, 69, 114, 126, 33, 27, 149, 250, 47, 109, 51, 87, 68, 144, 2,
        42, 4, 27, 47, 130, 133, 206, 111, 246, 164, 164, 158, 47, 192, 157, 95,
        203, 115, 111, 228, 205, 196, 147, 169, 80, 248, 56, 183, 91, 15, 125,
      ])
    );
  
    // The mint address of the token you are staking
    const mintAddress = mint;
  
    // Ensure the user's token account is created and initialized for the token
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, // connection to the Solana cluster
      wallet, // fee payer (user)
      mintAddress, // token mint address
      wallet.publicKey // owner of the token account
    );
  
    const programId = new PublicKey(
      "HVA9bXns8yg2vG7VFU1rCtAL9FSXjMCkMMj6RcEjUbdP"
    );
  
    // Find or create the staking account associated with the token
    // const [stakingAccountPublicKey, _bump] = await findProgramAddress(
    //   programId,
    //   wallet.publicKey
    // );

    const stakingAccountPublicKey = new PublicKey("2SKGL7hP8pEcHJkWDYi6zHBJ7LKGpEsYAb9KyuyqieHu");

  
    // Ensure the staking account is an associated token account for the same mint
    const stakingTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintAddress,
      stakingAccountPublicKey, // This will create a token account for the staking account if it doesn't exist
      true // This ensures it's a PDA (Program Derived Address)
    );
  
    console.log("the staking account is", stakingAccountPublicKey.toBase58());
  
    console.log(
      "the stakingToken account",
      stakingTokenAccount.address.toBase58()
    );
    // Prepare the staking transaction (token transfer)
    const transaction = new Transaction().add(
      createTransferInstruction(
        tokenAccount.address, // Source (user's token account)
        stakingTokenAccount.address, // Destination (staking account)
        wallet.publicKey, // Owner of the source account
        stakeAmount, // Amount of tokens to stake
        [], // No multisig signers needed here
        TOKEN_PROGRAM_ID // SPL Token Program ID
      )
    );
  
    // Send the transaction
    const signature = await connection.sendTransaction(transaction, [wallet]);
    console.log("Staked Tokens:", signature);
  }

//   const mintAddress = new PublicKey(
//     "BSSbai4rmTWoiswetQUb7X5TwTvT93WoDPEF3QuNCdd"
//   ); // Replace with your mint address
//   stakeTokens(100, mintAddress);



async function unstakeTokens(unstakeAmount: number, mint: PublicKey) {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    
    // Fetch user's wallet public key
    const wallet = Keypair.fromSecretKey(
              Uint8Array.from([
                109, 197, 16, 57, 107, 45, 107, 56, 233, 120, 83, 197, 238, 173, 211, 212,
                242, 182, 66, 69, 114, 126, 33, 27, 149, 250, 47, 109, 51, 87, 68, 144, 2,
                42, 4, 27, 47, 130, 133, 206, 111, 246, 164, 164, 158, 47, 192, 157, 95,
                203, 115, 111, 228, 205, 196, 147, 169, 80, 248, 56, 183, 91, 15, 125,
              ])
            );
  
    // Ensure the user's token account is created and initialized for the token
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint, // token mint address
      wallet.publicKey
    );
  
    const programId = new PublicKey("HVA9bXns8yg2vG7VFU1rCtAL9FSXjMCkMMj6RcEjUbdP");
  
    // Find the staking account associated with the token
    // const [stakingAccountPublicKey, _bump] = await findProgramAddress(
    //   programId,
    //   wallet.publicKey
    // );
    const stakingAccountPublicKey = new PublicKey("2SKGL7hP8pEcHJkWDYi6zHBJ7LKGpEsYAb9KyuyqieHu");
  
    //Fetch the staking token account, assumed to be initialized
    const stakingTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      stakingAccountPublicKey
    );
    // const stakingTokenAccount = new PublicKey("HHJEorqjPT8ctD3EMHgfCD3rjFBgwH4GFKCLga6kXVyS")

    // console.log("Staking Token Account:", stakingTokenAccount.address.toBase58());
    console.log("User Wallet Public Key:", wallet.publicKey.toBase58());
    console.log("User Token Account:", userTokenAccount.address.toBase58());
  
    // Check balance in staking account
    // const stakingBalance = await connection.getTokenAccountBalance(stakingTokenAccount.address);
    // console.log("Staking Token Account Balance:", stakingBalance.value.amount);
  
    // if (parseInt(stakingBalance.value.amount) < unstakeAmount) {
    //   throw new Error("Insufficient balance in staking account.");
    // }
  
    // Prepare the unstaking transaction (token transfer back to user's token account)
    const transaction = new Transaction().add(
      createTransferInstruction(
        stakingTokenAccount.address, // Source (staking token account)
        userTokenAccount.address, // Destination (user's token account)
        wallet.publicKey, // Owner of the staking account
        unstakeAmount, // Amount of tokens to unstake
        [], // No multisig signers needed here
        TOKEN_PROGRAM_ID // SPL Token Program ID
      )
    );
  
    // Send the transaction
    const signature = await connection.sendTransaction(transaction, [wallet]);
    console.log("Unstaked Tokens:", signature);
  }
  
  // Example usage:
  const mintAddress = new PublicKey("BSSbai4rmTWoiswetQUb7X5TwTvT93WoDPEF3QuNCdd");
  unstakeTokens(20, mintAddress);
  
  
//   Example usage:
//   const mintAddress = new PublicKey(
//     "BSSbai4rmTWoiswetQUb7X5TwTvT93WoDPEF3QuNCdd"
//   ); // Replace with your mint address
//   stakeTokens(100, mintAddress);

// async function createStakeAccount() {
//     // Create a new Keypair for the new stake account
//     const stakeAccount = Keypair.generate();
//     const ownerKeypair = Keypair.fromSecretKey(Uint8Array.from([109,197,16,57,107,45,107,56,233,120,83,197,238,173,211,212,242,182,66,69,114,126,33,27,149,250,47,109,51,87,68,144,2,42,4,27,47,130,133,206,111,246,164,164,158,47,192,157,95,203,115,111,228,205,196,147,169,80,248,56,183,91,15,125]));

//     // Connect to the Solana cluster
//     const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

//     // Calculate the required lamports
//     const lamports = await connection.getMinimumBalanceForRentExemption(200);

//     // Create the stake account
//     const transaction = new Transaction().add(
//         SystemProgram.createAccount({
//             fromPubkey: ownerKeypair.publicKey,
//             newAccountPubkey: stakeAccount.publicKey,
//             lamports,
//             space: 200,
//             programId: StakeProgram.programId,
//         }),
//         StakeProgram.initialize({
//             stakePubkey: stakeAccount.publicKey,
//             authorized: {
//                 staker: ownerKeypair.publicKey,
//                 withdrawer: ownerKeypair.publicKey,
//             },
//         })
//     );

//     // Send the transaction
//     await sendAndConfirmTransaction(connection, transaction, [ownerKeypair, stakeAccount]);
//     console.log('Stake account created with public key:', stakeAccount.publicKey.toBase58());
// }

// createStakeAccount().catch(console.error);
  