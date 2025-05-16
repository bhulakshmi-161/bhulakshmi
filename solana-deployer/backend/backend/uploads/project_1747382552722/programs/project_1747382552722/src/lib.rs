use anchor_lang::prelude::*;

declare_id!("7bhtGYDjVH3uon3G43WSHyJxTDV8pfEgV7vD26DYJ3oJ");

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

