use anchor_lang::prelude::*;

declare_id!("7VuVB9jUbAnfyAj4fv2UgSG2H7ZuvfQm3VLmzs74ATVS");

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

