use anchor_lang::prelude::*;

declare_id!("GjqKuMughw9pSXJ7vtxpDajBD9HQ8t48xXbP2x364Xk9");

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

