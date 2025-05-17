use anchor_lang::prelude::*;

declare_id!("9nKXZsbyNmcZhnDWTVHgZwvtnmjCLuFPXKvHmEz3FvZR");

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

