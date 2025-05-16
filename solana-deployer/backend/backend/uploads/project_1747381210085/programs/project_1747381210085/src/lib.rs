use anchor_lang::prelude::*;

declare_id!("75NfnFVcnA7eWnmXYtoUrWZ7Y9yzL7aLoydrkF1Ah2EQ");

#[program]
pub mod sample_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized successfully!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

