use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, CloseAccount};

declare_id!("YourProgramIDHere111111111111111111111111111");

#[program]
pub mod spl_account_closer {
    use super::*;

    /// Close an empty SPL token account and return rent to the owner
    pub fn close_empty_account(ctx: Context<CloseEmptyAccount>) -> Result<()> {
        let token_account = &ctx.accounts.token_account;

        // Verify the token account has zero balance
        require!(
            token_account.amount == 0,
            ErrorCode::AccountNotEmpty
        );

        // Close the token account using CPI
        let cpi_accounts = CloseAccount {
            account: ctx.accounts.token_account.to_account_info(),
            destination: ctx.accounts.owner.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::close_account(cpi_ctx)?;

        Ok(())
    }

    /// Close multiple empty SPL token accounts in one transaction
    pub fn close_multiple_accounts(
        ctx: Context<CloseMultipleAccounts>,
        account_count: u8,
    ) -> Result<()> {
        require!(
            account_count as usize == ctx.remaining_accounts.len(),
            ErrorCode::InvalidAccountCount
        );

        let owner = ctx.accounts.owner.to_account_info();
        let token_program = ctx.accounts.token_program.to_account_info();

        // Iterate through remaining accounts and close each one
        for account_info in ctx.remaining_accounts.iter() {
            // Deserialize token account
            let token_account = TokenAccount::try_deserialize(
                &mut &account_info.data.borrow()[..]
            )?;

            // Verify zero balance
            require!(
                token_account.amount == 0,
                ErrorCode::AccountNotEmpty
            );

            // Verify owner matches
            require!(
                token_account.owner == owner.key(),
                ErrorCode::InvalidOwner
            );

            // Close the account
            let cpi_accounts = CloseAccount {
                account: account_info.clone(),
                destination: owner.clone(),
                authority: owner.clone(),
            };

            let cpi_ctx = CpiContext::new(token_program.clone(), cpi_accounts);
            token::close_account(cpi_ctx)?;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CloseEmptyAccount<'info> {
    #[account(
        mut,
        constraint = token_account.owner == owner.key() @ ErrorCode::InvalidOwner
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseMultipleAccounts<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Token account is not empty")]
    AccountNotEmpty,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Invalid account count")]
    InvalidAccountCount,
}
