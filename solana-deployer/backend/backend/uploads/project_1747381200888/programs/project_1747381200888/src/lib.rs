use anchor_lang::prelude::*;

declare_id!("CkDXvQfdaMqqAzXwjWBSBiKzgj4DzLvvqMd3kYz2d3K");

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

