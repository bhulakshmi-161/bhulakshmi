use anchor_lang::prelude::*;

declare_id!("GAsAzHZctfJv4Ns5k8j5kTKr8gCmfv2Fxje3kkSjFxzG");

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

