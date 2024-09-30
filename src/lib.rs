use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{clock::Clock, rent::Rent, Sysvar},
};

use spl_token::{self, instruction::transfer};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct StakeData {
    pub staked_amount: u64,
    pub staked_at: u64,
    pub reward_accrued: u64,
}

entrypoint!(process_instruction);

const STAKE_INSTRUCTION: u8 = 1;
const UNSTAKE_INSTRUCTION: u8 = 2;

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let instruction_type = instruction_data[0];

    match instruction_type {
        STAKE_INSTRUCTION => {
            process_stake_instruction(program_id, accounts, &instruction_data[1..])
        }
        UNSTAKE_INSTRUCTION => {
            process_unstake_instruction(program_id, accounts, &instruction_data[1..])
        }
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn process_stake_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let user_account = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let staking_account = next_account_info(accounts_iter)?;
    let token_program_account = next_account_info(accounts_iter)?;

    // Deserialize the instruction to get the amount of tokens to stake
    let amount_to_stake = u64::from_le_bytes(instruction_data.try_into().unwrap());

    // Transfer SPL tokens from user's token account to the staking account
    invoke(
        &spl_token::instruction::transfer(
            token_program_account.key,
            user_token_account.key,
            staking_account.key,
            user_account.key,
            &[],
            amount_to_stake,
        )?,
        &[
            user_account.clone(),
            user_token_account.clone(),
            staking_account.clone(),
            token_program_account.clone(),
        ],
    )?;

    // Store staking info (like amount, start time) in a state account
    let current_time = Clock::get()?.unix_timestamp as u64;
    let staking_data = StakeData {
        staked_amount: amount_to_stake,
        staked_at: current_time,
        reward_accrued: 0,
    };

    // Save staking data to the staking account (Borsh serialization)
    staking_data.serialize(&mut &mut staking_account.data.borrow_mut()[..])?;

    msg!("Staked {} tokens", amount_to_stake);
    Ok(())
}

fn process_unstake_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let user_account = next_account_info(accounts_iter)?; // User's wallet
    let user_token_account = next_account_info(accounts_iter)?; // User's token account
    let staking_account = next_account_info(accounts_iter)?; // Staking account (owned by the program)
    let token_program_account = next_account_info(accounts_iter)?; // SPL Token program

    // Check if user_account is a signer
    if !user_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Deserialize staking data from the staking account
    let mut staking_data = StakeData::try_from_slice(&staking_account.data.borrow())?;

    // Ensure that the user is allowed to unstake
    if staking_data.staked_amount == 0 {
        return Err(ProgramError::InvalidAccountData);
    }

    // You might want to validate or use instruction_data here if you're passing additional info
    if instruction_data.len() != 8 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let amount_to_unstake = u64::from_le_bytes(instruction_data.try_into().unwrap());

    if amount_to_unstake > staking_data.staked_amount {
        return Err(ProgramError::InsufficientFunds);
    }

    // Calculate rewards and prepare for transfer
    let current_time = Clock::get()?.unix_timestamp as u64;
    let time_staked = current_time - staking_data.staked_at;
    let reward = calculate_reward(staking_data.staked_amount, time_staked);
    staking_data.reward_accrued += reward;

    // Transfer the staked SPL tokens back to the user's wallet
    let transfer_ix = spl_token::instruction::transfer(
        token_program_account.key,
        staking_account.key,
        user_token_account.key,
        user_account.key, // User account must be the payer here
        &[],
        amount_to_unstake, // Use the amount provided in the instruction data
    )?;

    invoke(
        &transfer_ix,
        &[
            staking_account.clone(),       // Writable account
            user_token_account.clone(),    // Writable account
            token_program_account.clone(), // Token program
        ],
    )?;

    // Reset staked amount and update staking info
    staking_data.staked_amount -= amount_to_unstake; // Deduct the unstaked amount

    // Save updated staking data to the staking account
    staking_data.serialize(&mut &mut staking_account.data.borrow_mut()[..])?;

    msg!(
        "Unstaked successfully. Rewards accrued: {}",
        staking_data.reward_accrued
    );
    Ok(())
}

// Helper function to calculate rewards (customize based on your logic)
fn calculate_reward(amount: u64, time_staked: u64) -> u64 {
    let days_staked = time_staked / (24 * 60 * 60); // Convert seconds to days
    let reward_per_day = 10; // Example fixed reward per day, can be dynamic
    days_staked * reward_per_day * amount
}
