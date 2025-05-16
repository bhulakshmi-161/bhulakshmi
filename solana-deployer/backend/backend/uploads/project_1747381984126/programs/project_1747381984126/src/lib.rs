use anchor_lang::prelude::*;

declare_id!("713LW5CNjHs3swyz9Gf73stDo4D56KaFHqnJXhNoMot6");

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

