use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
    clock::Clock,
};
use spl_token::{
    instruction::transfer,
};
use solana_program::program_pack::{Pack, Sealed};
use solana_program::program::invoke;
use solana_program::program::invoke_signed;



entrypoint!(process_instruction);

#[derive(Clone, Debug, PartialEq)]

pub enum StakingInstruction {
    Initialize { staking_vault: Pubkey },
    Stake { amount: u64, duration: u64 },
    Withdraw,
}

impl StakingInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match tag {
            0 => {
                let (staking_vault, _rest) = Self::unpack_pubkey(rest)?;
                Self::Initialize { staking_vault }
            },
            1 => {
                let (amount, rest) = rest.split_at(8);
                let (duration, _rest) = rest.split_at(8);
                Self::Stake {
                    amount: u64::from_le_bytes(amount.try_into().unwrap()),
                    duration: u64::from_le_bytes(duration.try_into().unwrap()),
                }
            },
            2 => Self::Withdraw,
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }

    fn unpack_pubkey(input: &[u8]) -> Result<(Pubkey, &[u8]), ProgramError> {
        if input.len() >= 32 {
            let (key, rest) = input.split_at(32);
            let pubkey = Pubkey::new(key);
            Ok((pubkey, rest))
        } else {
            Err(ProgramError::InvalidInstructionData)
        }
    }
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct StakingAccount {
    pub staking_vault: Pubkey,
}

impl Sealed for StakingAccount {}

impl Pack for StakingAccount {
    const LEN: usize = 32;

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let staking_vault = Pubkey::new(&src[0..32]);
        Ok(StakingAccount { staking_vault })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        dst[0..32].copy_from_slice(self.staking_vault.as_ref());
    }
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct UserStaking {
    pub amount: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub reward_rate: u64,
}

impl Sealed for UserStaking {}

impl Pack for UserStaking {
    const LEN: usize = 32;

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let amount = u64::from_le_bytes(src[0..8].try_into().unwrap());
        let start_time = u64::from_le_bytes(src[8..16].try_into().unwrap());
        let end_time = u64::from_le_bytes(src[16..24].try_into().unwrap());
        let reward_rate = u64::from_le_bytes(src[24..32].try_into().unwrap());
        Ok(UserStaking {
            amount,
            start_time,
            end_time,
            reward_rate,
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        dst[0..8].copy_from_slice(&self.amount.to_le_bytes());
        dst[8..16].copy_from_slice(&self.start_time.to_le_bytes());
        dst[16..24].copy_from_slice(&self.end_time.to_le_bytes());
        dst[24..32].copy_from_slice(&self.reward_rate.to_le_bytes());
    }
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = StakingInstruction::unpack(instruction_data)?;

    match instruction {
        StakingInstruction::Initialize { staking_vault } => {
            msg!("Instruction: Initialize");
            process_initialize(accounts, staking_vault, program_id)
        }
        StakingInstruction::Stake { amount, duration } => {
            msg!("Instruction: Stake");
            process_stake(accounts, amount, duration, program_id)
        }
        StakingInstruction::Withdraw => {
            msg!("Instruction: Withdraw");
            process_withdraw(accounts, program_id)
        }
    }
}

pub fn process_initialize(
    accounts: &[AccountInfo],
    staking_vault: Pubkey,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let staking_account = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;

    if !rent.is_exempt(staking_account.lamports(), staking_account.data_len()) {
        return Err(ProgramError::AccountNotRentExempt);
    }

    let mut staking_account_data = StakingAccount::unpack_from_slice(&staking_account.data.borrow())?;
    staking_account_data.staking_vault = staking_vault;
    StakingAccount::pack_into_slice(&staking_account_data, &mut staking_account.data.borrow_mut());

    Ok(())
}

pub fn process_stake(
    accounts: &[AccountInfo],
    amount: u64,
    duration: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let staking_account = next_account_info(account_info_iter)?;
    let user_staking = next_account_info(account_info_iter)?;
    let user_token_account = next_account_info(account_info_iter)?;
    let staking_vault = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let user = next_account_info(account_info_iter)?;
    let clock = Clock::get()?;

    let reward_rate = match duration {
        30 => 3,
        60 => 7,
        _ => return Err(ProgramError::InvalidInstructionData),
    };

    let mut user_staking_data = UserStaking::unpack_from_slice(&user_staking.data.borrow())?;
    user_staking_data.amount = amount;
    user_staking_data.start_time = clock.unix_timestamp as u64;
    user_staking_data.end_time = user_staking_data.start_time + duration * 86400;
    user_staking_data.reward_rate = reward_rate;
    UserStaking::pack_into_slice(&user_staking_data, &mut user_staking.data.borrow_mut());

    let transfer_instruction = transfer(
        token_program.key,
        user_token_account.key,
        staking_vault.key,
        user.key,
        &[],
        amount,
    )?;

    invoke(
        &transfer_instruction,
        &[
            user_token_account.clone(),
            staking_vault.clone(),
            user.clone(),
            token_program.clone(),
        ],
    )?;

    Ok(())
}

pub fn process_withdraw(accounts: &[AccountInfo], program_id: &Pubkey) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let staking_account = next_account_info(account_info_iter)?;
    let user_staking = next_account_info(account_info_iter)?;
    let user_token_account = next_account_info(account_info_iter)?;
    let staking_vault = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let clock = Clock::get()?;

    let user_staking_data = UserStaking::unpack_from_slice(&user_staking.data.borrow())?;
    if (clock.unix_timestamp as u64) < user_staking_data.end_time {
        return Err(ProgramError::InvalidInstructionData);
    }

    let reward = user_staking_data.amount * user_staking_data.reward_rate / 100;
    let total_amount = user_staking_data.amount + reward;

    let seeds = &[staking_account.key.as_ref()];
    let signer = &[&seeds[..]];

    let transfer_instruction = transfer(
        token_program.key,
        staking_vault.key,
        user_token_account.key,
        staking_account.key,
        &[],
        total_amount,
    )?;

    invoke_signed(
        &transfer_instruction,
        &[
            staking_vault.clone(),
            user_token_account.clone(),
            staking_account.clone(),
            token_program.clone(),
        ],
        &[seeds],
    )?;

    let mut user_staking_data = UserStaking::unpack_from_slice(&user_staking.data.borrow())?;
    user_staking_data.amount = 0;
    UserStaking::pack_into_slice(&user_staking_data, &mut user_staking.data.borrow_mut());

    Ok(())
}



//test s

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::{
        clock::Epoch,
        pubkey::Pubkey,
        rent::Rent,
        account_info::AccountInfo,
        clock::Clock,
        sysvar::clock::ClockSysvar,
    };
    use std::cell::RefCell;

    fn create_is_signer_account_infos<'a>(key: &'a Pubkey, lamports: &'a mut u64, data: &'a mut [u8]) -> AccountInfo<'a> {
        AccountInfo {
            key,
            is_signer: true,
            is_writable: true,
            lamports: RefCell::new(lamports),
            data: RefCell::new(data),
            owner: key,
            executable: false,
            rent_epoch: Epoch::default(),
        }
    }

    #[test]
    fn test_initialize() {
        let program_id = Pubkey::new_unique();
        let staking_vault = Pubkey::new_unique();
        let staking_account = Pubkey::new_unique();
        let rent = Rent::default();

        let mut staking_account_data = vec![0; StakingAccount::LEN];
        let mut lamports = rent.minimum_balance(StakingAccount::LEN);
        let staking_account_info = create_is_signer_account_infos(&staking_account, &mut lamports, &mut staking_account_data);

        let mut rent_account_data = vec![0; 100];
        let rent_account_info = create_is_signer_account_infos(&Rent::id(), &mut 0, &mut rent_account_data);

        let result = process_initialize(
            &[staking_account_info, rent_account_info],
            staking_vault,
            &program_id,
        );

        assert_eq!(result, Ok(()));
    }

    #[test]
    fn test_stake() {
        let program_id = Pubkey::new_unique();
        let staking_vault = Pubkey::new_unique();
        let staking_account = Pubkey::new_unique();
        let user_staking = Pubkey::new_unique();
        let user_token_account = Pubkey::new_unique();
        let token_program = Pubkey::new_unique();
        let user = Pubkey::new_unique();

        let clock = Clock {
            unix_timestamp: 1_620_000_000,
            ..Clock::default()
        };

        let reward_rate = 3;
        let amount = 1000;
        let duration = 30;

        let mut staking_account_data = vec![0; StakingAccount::LEN];
        let mut user_staking_data = vec![0; UserStaking::LEN];
        let mut lamports = 0;
        let mut user_token_account_lamports = amount;

        let staking_account_info = create_is_signer_account_infos(&staking_account, &mut lamports, &mut staking_account_data);
        let user_staking_info = create_is_signer_account_infos(&user_staking, &mut lamports, &mut user_staking_data);
        let user_token_account_info = create_is_signer_account_infos(&user_token_account, &mut user_token_account_lamports, &mut []);
        let staking_vault_info = create_is_signer_account_infos(&staking_vault, &mut lamports, &mut []);
        let token_program_info = create_is_signer_account_infos(&token_program, &mut lamports, &mut []);
        let user_info = create_is_signer_account_infos(&user, &mut lamports, &mut []);

        let clock_sysvar = ClockSysvar {
            clock,
            ..ClockSysvar::default()
        };

        let result = process_stake(
            &[
                staking_account_info,
                user_staking_info,
                user_token_account_info,
                staking_vault_info,
                token_program_info,
                user_info,
                clock_sysvar.account_info(),
            ],
            amount,
            duration,
            &program_id,
        );

        assert_eq!(result, Ok(()));
    }

    #[test]
    fn test_withdraw() {
        let program_id = Pubkey::new_unique();
        let staking_vault = Pubkey::new_unique();
        let staking_account = Pubkey::new_unique();
        let user_staking = Pubkey::new_unique();
        let user_token_account = Pubkey::new_unique();
        let token_program = Pubkey::new_unique();
        let user = Pubkey::new_unique();

        let clock = Clock {
            unix_timestamp: 1_620_000_000 + 31 * 86400,
            ..Clock::default()
        };

        let amount = 1000;
        let reward_rate = 3;
        let reward = amount * reward_rate / 100;
        let total_amount = amount + reward;

        let mut staking_account_data = vec![0; StakingAccount::LEN];
        let mut user_staking_data = vec![0; UserStaking::LEN];
        let mut lamports = 0;
        let mut user_token_account_lamports = total_amount;

        let staking_account_info = create_is_signer_account_infos(&staking_account, &mut lamports, &mut staking_account_data);
        let user_staking_info = create_is_signer_account_infos(&user_staking, &mut lamports, &mut user_staking_data);
        let user_token_account_info = create_is_signer_account_infos(&user_token_account, &mut user_token_account_lamports, &mut []);
        let staking_vault_info = create_is_signer_account_infos(&staking_vault, &mut lamports, &mut []);
        let token_program_info = create_is_signer_account_infos(&token_program, &mut lamports, &mut []);
        let user_info = create_is_signer_account_infos(&user, &mut lamports, &mut []);

        let clock_sysvar = ClockSysvar {
            clock,
            ..ClockSysvar::default()
        };

        let mut user_staking_data_obj = UserStaking::default();
        user_staking_data_obj.amount = amount;
        user_staking_data_obj.start_time = 1_620_000_000; //uinx timestap
        user_staking_data_obj.end_time = user_staking_data_obj.start_time + 30 * 86400;
        user_staking_data_obj.reward_rate = reward_rate;
        UserStaking::pack_into_slice(&user_staking_data_obj, &mut user_staking_data);

        let result = process_withdraw(
            &[
                staking_account_info,
                user_staking_info,
                user_token_account_info,
                staking_vault_info,
                token_program_info,
                user_info,
                clock_sysvar.account_info(),
            ],
            &program_id,
        );

        assert_eq!(result, Ok(()));
    }
}
