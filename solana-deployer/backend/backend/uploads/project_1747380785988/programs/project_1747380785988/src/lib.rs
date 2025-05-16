use anchor_lang::prelude::*;

declare_id!("8bLw1ozqugaWcXF8qFJFYbX2XDnzW526WgBGQGYJb1bX");

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

