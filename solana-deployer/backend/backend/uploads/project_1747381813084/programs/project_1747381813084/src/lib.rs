use anchor_lang::prelude::*;

declare_id!("BXnUAfkqFRHFvMk5fXAnUEw1nqYz8JbHnuaeJxTyYHaL");

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

