use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use crate::{constants::*, errors::ErrorCode};

#[derive(Accounts)]
pub struct SettleFee<'info> {
    /// CHECK: PDA authority for fee collection that holds the collected fees
    #[account(
        seeds = [b"fee_authority"],
        bump
    )]
    pub fee_collection_authority: AccountInfo<'info>,

    /// The token account that holds collected protocol fees
    #[account(
        mut,
        constraint = source_fee_account.owner == fee_collection_authority.key()
    )]
    pub source_fee_account: Account<'info, TokenAccount>,

    /// Token account for liquidity stakers (50% of fees)
    #[account(
        mut,
        constraint = liquidity_staker_account.mint == source_fee_account.mint,
        seeds = [LIQUIDITY_STAKER_PDA_SEED, source_fee_account.mint.as_ref()],
        bump
    )]
    pub liquidity_staker_account: Account<'info, TokenAccount>,

    /// Token account for protocol treasury (30% of fees)
    #[account(
        mut,
        constraint = treasury_account.mint == source_fee_account.mint,
        seeds = [TREASURY_PDA_SEED, source_fee_account.mint.as_ref()],
        bump
    )]
    pub treasury_account: Account<'info, TokenAccount>,

    /// Token account for MEV bounty pool (20% of fees)
    #[account(
        mut,
        constraint = bounty_account.mint == source_fee_account.mint,
        seeds = [BOUNTY_PDA_SEED, source_fee_account.mint.as_ref()],
        bump
    )]
    pub bounty_account: Account<'info, TokenAccount>,

    /// The token mint for the fees being distributed
    pub token_mint: Account<'info, Mint>,

    /// Relayer or authorized caller who triggers fee distribution
    #[account(mut)]
    pub caller: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<SettleFee>, fee_amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    
    // ==================== INPUT VALIDATION ====================
    
    require!(fee_amount > 0, ErrorCode::AmountTooSmall);
    require!(
        ctx.accounts.source_fee_account.amount >= fee_amount,
        ErrorCode::InsufficientBalance
    );
    
    // ==================== FEE CALCULATION ====================
    
    // Calculate distribution amounts
    let treasury_fee = fee_amount
        .checked_mul(30)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(100)
        .ok_or(ErrorCode::MathOverflow)?;
    
    let stakers_fee = fee_amount
        .checked_mul(50)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(100)
        .ok_or(ErrorCode::MathOverflow)?;
    
    let bounty_fee = fee_amount
        .checked_sub(treasury_fee)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_sub(stakers_fee)
        .ok_or(ErrorCode::MathOverflow)?;
    
    // ==================== FEE DISTRIBUTION ====================
    
    // Get PDA seeds and bumps for signing
    let fee_authority_bump = ctx.bumps.fee_collection_authority;
    let authority_seeds = &[
        b"fee_authority".as_ref(),
        &[fee_authority_bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];
    
    // Transfer to liquidity stakers (50%)
    let stakers_cpi = Transfer {
        from: ctx.accounts.source_fee_account.to_account_info(),
        to: ctx.accounts.liquidity_staker_account.to_account_info(),
        authority: ctx.accounts.fee_collection_authority.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            stakers_cpi,
            signer_seeds,
        ),
        stakers_fee,
    )?;
    
    // Transfer to treasury (30%)
    let treasury_cpi = Transfer {
        from: ctx.accounts.source_fee_account.to_account_info(),
        to: ctx.accounts.treasury_account.to_account_info(),
        authority: ctx.accounts.fee_collection_authority.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            treasury_cpi,
            signer_seeds,
        ),
        treasury_fee,
    )?;
    
    // Transfer to MEV bounty pool (20%)
    let bounty_cpi = Transfer {
        from: ctx.accounts.source_fee_account.to_account_info(),
        to: ctx.accounts.bounty_account.to_account_info(),
        authority: ctx.accounts.fee_collection_authority.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            bounty_cpi,
            signer_seeds,
        ),
        bounty_fee,
    )?;
    
    // ==================== EVENT EMISSION ====================
    
    emit!(FeeDistributed {
        token_mint: ctx.accounts.token_mint.key(),
        total_fee: fee_amount,
        liquidity_stakers_fee: stakers_fee,
        treasury_fee,
        mev_bounty_fee: bounty_fee,
        caller: ctx.accounts.caller.key(),
        timestamp: clock.unix_timestamp,
    });
    
    // ==================== LOGGING ====================
    
    msg!("Fee distribution completed:");
    msg!("  Total fee: {}", fee_amount);
    msg!("  Liquidity stakers (50%): {}", stakers_fee);
    msg!("  Treasury (30%): {}", treasury_fee);
    msg!("  MEV bounty (20%): {}", bounty_fee);
    msg!("  Token mint: {}", ctx.accounts.token_mint.key());
    msg!("  Caller: {}", ctx.accounts.caller.key());
    
    Ok(())
}

// ==================== INITIALIZATION FUNCTIONS ====================

#[derive(Accounts)]
pub struct InitializeFeeAccounts<'info> {
    /// CHECK: PDA authority for fee collection
    #[account(
        init,
        payer = payer,
        space = 0,
        seeds = [b"fee_authority"],
        bump
    )]
    pub fee_collection_authority: AccountInfo<'info>,

    /// Initialize liquidity stakers fee account
    #[account(
        init,
        payer = payer,
        token::mint = token_mint,
        token::authority = fee_collection_authority,
        seeds = [LIQUIDITY_STAKER_PDA_SEED, token_mint.key().as_ref()],
        bump
    )]
    pub liquidity_staker_account: Account<'info, TokenAccount>,

    /// Initialize treasury fee account
    #[account(
        init,
        payer = payer,
        token::mint = token_mint,
        token::authority = fee_collection_authority,
        seeds = [TREASURY_PDA_SEED, token_mint.key().as_ref()],
        bump
    )]
    pub treasury_account: Account<'info, TokenAccount>,

    /// Initialize MEV bounty fee account
    #[account(
        init,
        payer = payer,
        token::mint = token_mint,
        token::authority = fee_collection_authority,
        seeds = [BOUNTY_PDA_SEED, token_mint.key().as_ref()],
        bump
    )]
    pub bounty_account: Account<'info, TokenAccount>,

    /// Initialize fee collection account
    #[account(
        init,
        payer = payer,
        token::mint = token_mint,
        token::authority = fee_collection_authority,
        seeds = [b"fee_collection", token_mint.key().as_ref()],
        bump
    )]
    pub fee_collection_account: Account<'info, TokenAccount>,

    /// The token mint for the fee accounts
    pub token_mint: Account<'info, Mint>,

    /// Payer for account creation
    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_fee_accounts(ctx: Context<InitializeFeeAccounts>) -> Result<()> {
    msg!("Fee accounts initialized for mint: {}", ctx.accounts.token_mint.key());
    msg!("  Fee collection authority: {}", ctx.accounts.fee_collection_authority.key());
    msg!("  Liquidity stakers account: {}", ctx.accounts.liquidity_staker_account.key());
    msg!("  Treasury account: {}", ctx.accounts.treasury_account.key());
    msg!("  MEV bounty account: {}", ctx.accounts.bounty_account.key());
    msg!("  Fee collection account: {}", ctx.accounts.fee_collection_account.key());
    
    emit!(FeeAccountsInitialized {
        token_mint: ctx.accounts.token_mint.key(),
        fee_authority: ctx.accounts.fee_collection_authority.key(),
        liquidity_stakers: ctx.accounts.liquidity_staker_account.key(),
        treasury: ctx.accounts.treasury_account.key(),
        mev_bounty: ctx.accounts.bounty_account.key(),
        fee_collection: ctx.accounts.fee_collection_account.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

// ==================== EVENTS ====================

#[event]
pub struct FeeDistributed {
    pub token_mint: Pubkey,
    pub total_fee: u64,
    pub liquidity_stakers_fee: u64,
    pub treasury_fee: u64,
    pub mev_bounty_fee: u64,
    pub caller: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FeeAccountsInitialized {
    pub token_mint: Pubkey,
    pub fee_authority: Pubkey,
    pub liquidity_stakers: Pubkey,
    pub treasury: Pubkey,
    pub mev_bounty: Pubkey,
    pub fee_collection: Pubkey,
    pub timestamp: i64,
}