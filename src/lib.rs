use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{clock::Clock, Sysvar},
};
use spl_token::instruction::transfer;

// Define the structure for the staking account
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct StakingAccount {
    pub user: Pubkey,
    pub amount_staked: u64,
    pub stake_start_time: u64,
    pub reward_rate: u64,
    pub is_initialized: bool,
}

// Instructions to be handled by the program
pub enum StakingInstruction {
    Stake { amount: u64 },
    Unstake,
}

impl StakingInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match tag {
            0 => {
                let amount = Self::unpack_u64(rest)?;
                Self::Stake { amount }
            }
            1 => Self::Unstake,
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }

    fn unpack_u64(input: &[u8]) -> Result<u64, ProgramError> {
        let amount = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(ProgramError::InvalidInstructionData)?;
        Ok(amount)
    }
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = StakingInstruction::unpack(instruction_data)?;
    match instruction {
        StakingInstruction::Stake { amount } => stake_tokens(program_id, accounts, amount),
        StakingInstruction::Unstake => unstake_tokens(program_id, accounts),
    }
}

fn stake_tokens(program_id: &Pubkey, accounts: &[AccountInfo], amount: u64) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let staking_account = next_account_info(accounts_iter)?;
    let user_account = next_account_info(accounts_iter)?;
    let token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;
    let clock = Clock::get()?.unix_timestamp as u64;

    // Ensure that the staking account belongs to this program
    if staking_account.owner != program_id {
        msg!("Staking account does not have the correct program ID");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Check if the account data is empty or not initialized
    let mut staking_data: StakingAccount;
    if staking_account.data_is_empty() {
        // Initialize staking account if it's empty
        msg!("Initializing staking account");
        staking_data = StakingAccount {
            user: *user_account.key,
            amount_staked: 0,
            stake_start_time: clock,
            reward_rate: 10,
            is_initialized: true,
        };
    } else {
        // Attempt to deserialize the existing data
        staking_data =
            StakingAccount::try_from_slice(&staking_account.data.borrow()).map_err(|_| {
                msg!("Failed to deserialize staking account data");
                ProgramError::InvalidAccountData
            })?;
    }

    if !staking_data.is_initialized {
        msg!("Staking account is not initialized");
        return Err(ProgramError::UninitializedAccount);
    }

    if amount == 0 {
        msg!("Staking amount cannot be zero");
        return Err(ProgramError::InvalidArgument);
    }

    // Transfer tokens from user to staking account
    let transfer_ix = transfer(
        token_program.key,
        user_account.key,
        token_account.key,
        staking_account.key, // staking account authority
        &[],
        amount,
    )?;
    invoke(
        &transfer_ix,
        &[
            user_account.clone(),
            token_account.clone(),
            token_program.clone(),
        ],
    )?;

    // Update staking details
    staking_data.amount_staked += amount;
    staking_data.stake_start_time = clock;

    // Serialize and save the staking account data
    staking_data
        .serialize(&mut &mut staking_account.data.borrow_mut()[..])
        .map_err(|_| {
            msg!("Failed to serialize staking account data");
            ProgramError::InvalidAccountData
        })?;

    msg!("Staked {} tokens successfully!", amount);
    Ok(())
}

fn unstake_tokens(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let staking_account = next_account_info(accounts_iter)?;
    let user_account = next_account_info(accounts_iter)?;
    let token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;
    let clock = Clock::get()?.unix_timestamp as u64;

    // Ensure that the staking account belongs to this program
    if staking_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Deserialize staking account
    let mut staking_data: StakingAccount =
        StakingAccount::try_from_slice(&staking_account.data.borrow())?;

    if !staking_data.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    let duration_staked = clock - staking_data.stake_start_time;
    let rewards = staking_data.amount_staked * staking_data.reward_rate * duration_staked / 1000;
    let total_amount = staking_data.amount_staked + rewards;

    let transfer_ix = transfer(
        token_program.key,
        token_account.key,
        user_account.key,
        staking_account.key, // staking account authority
        &[],
        total_amount,
    )?;
    invoke(
        &transfer_ix,
        &[
            token_account.clone(),
            user_account.clone(),
            token_program.clone(),
        ],
    )?;

    // Reset staking account
    staking_data.amount_staked = 0;
    staking_data.stake_start_time = 0;

    // Serialize and save the staking account data
    staking_data.serialize(&mut &mut staking_account.data.borrow_mut()[..])?;

    msg!(
        "Unstaked {} tokens with {} rewards",
        staking_data.amount_staked,
        rewards
    );
    Ok(())
}
