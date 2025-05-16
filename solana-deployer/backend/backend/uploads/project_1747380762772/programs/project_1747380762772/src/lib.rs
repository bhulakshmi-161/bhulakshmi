use anchor_lang::prelude::*;

declare_id!("CnZ8xoFGBozL3quWhP7hy7EEvgsTDcYFNonDjcmsc6o2");

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

