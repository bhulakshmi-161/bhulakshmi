use anchor_lang::prelude::*;

declare_id!("5FnVMV8jF1WmSfz3d7ryTT6MTWX5Pfg7cKbFFAZ6R9nB");

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

