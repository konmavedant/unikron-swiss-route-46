use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use crate::{state::*, errors::ErrorCode, constants::*};
use sha2::{Digest, Sha256};
use solana_program::{
    ed25519_program,
    sysvar::instructions::{load_instruction_at_checked},
};

#[derive(Accounts)]
pub struct RevealTrade<'info> {
    #[account(
        mut, 
        has_one = user, 
        seeds = [b"intent", user.key().as_ref(), &swap_intent.nonce.to_le_bytes()], 
        bump
    )]
    pub swap_intent: Account<'info, SwapIntent>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: We're verifying instruction manually for ed25519 signature
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    // Token accounts for the actual swap
    #[account(
        mut,
        constraint = user_token_in_account.mint == token_in_mint.key(),
        constraint = user_token_in_account.owner == user.key()
    )]
    pub user_token_in_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_out_account.mint == token_out_mint.key(),
        constraint = user_token_out_account.owner == user.key()
    )]
    pub user_token_out_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = relayer_token_in_account.mint == token_in_mint.key(),
        constraint = relayer_token_in_account.owner == relayer.key()
    )]
    pub relayer_token_in_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = relayer_token_out_account.mint == token_out_mint.key(),
        constraint = relayer_token_out_account.owner == relayer.key()
    )]
    pub relayer_token_out_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub relayer: Signer<'info>,

    // Token mints
    pub token_in_mint: Account<'info, Mint>,
    pub token_out_mint: Account<'info, Mint>,

    // Fee collection account owned by fee authority PDA
    #[account(
        mut,
        constraint = fee_collection_account.mint == token_in_mint.key(),
        constraint = fee_collection_account.owner == fee_collection_authority.key()
    )]
    pub fee_collection_account: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for fee collection
    #[account(
        seeds = [b"fee_authority"],
        bump
    )]
    pub fee_collection_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_reveal(
    ctx: Context<RevealTrade>,
    intent: TradeIntentData,
    expected_hash: [u8; 32],
    signature: [u8; 64],
) -> Result<()> {
    let stored = &mut ctx.accounts.swap_intent;
    let clock = Clock::get()?;
    
    // ==================== VALIDATION PHASE ====================
    
    // Check if intent is already revealed
    require!(!stored.revealed, ErrorCode::AlreadyRevealed);
    
    // Check expiry
    require!(
        stored.expiry > clock.unix_timestamp as u64, 
        ErrorCode::IntentExpired
    );
    
    // Check nonce matches
    require!(stored.nonce == intent.nonce, ErrorCode::NonceMismatch);
    
    // Verify user matches
    require_keys_eq!(intent.user, ctx.accounts.user.key(), ErrorCode::InvalidSignature);
    
    // Verify relayer matches
    require_keys_eq!(intent.relayer, ctx.accounts.relayer.key(), ErrorCode::InvalidSignature);
    
    // Verify token accounts match intent
    require_keys_eq!(intent.token_in, ctx.accounts.token_in_mint.key(), ErrorCode::HashMismatch);
    require_keys_eq!(intent.token_out, ctx.accounts.token_out_mint.key(), ErrorCode::HashMismatch);
    
    // Validate amounts
    require!(intent.amount_in > 0, ErrorCode::AmountTooSmall);
    require!(intent.min_out > 0, ErrorCode::AmountTooSmall);
    require!(intent.relayer_fee < intent.amount_in / 10, ErrorCode::RelayerFeeTooHigh);
    
    // ==================== HASH VERIFICATION ====================
    
    // Reconstruct hash of TradeIntentData
    let mut hasher = Sha256::new();
    hasher.update(intent.try_to_vec()?);
    let computed_hash = hasher.finalize();
    
    // Verify hash matches commitment
    require!(
        computed_hash[..] == expected_hash[..], 
        ErrorCode::HashMismatch
    );
    
    // Verify stored hash matches
    require!(
        stored.intent_hash == expected_hash,
        ErrorCode::HashMismatch
    );
    
    // ==================== ED25519 SIGNATURE VERIFICATION ====================
    
    verify_ed25519_signature(
        &ctx.accounts.instructions_sysvar,
        &signature,
        &ctx.accounts.user.key().to_bytes(),
        &expected_hash,
    )?;
    
    // ==================== AMOUNT VALIDATION ====================
    
    // Check user has sufficient balance
    require!(
        ctx.accounts.user_token_in_account.amount >= intent.amount_in,
        ErrorCode::InsufficientBalance
    );
    
    // ==================== CALCULATE PROTOCOL FEE ====================
    
    let protocol_fee = intent.amount_in
        .checked_mul(FEE_BASIS_POINTS)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::MathOverflow)?;
    
    // ==================== MOCK SWAP CALCULATION ====================
    
    // Mock Jupiter route calculation
    let swap_amount_after_fee = intent.amount_in
        .checked_sub(protocol_fee)
        .ok_or(ErrorCode::MathOverflow)?;
    
    // Simulate 1:1 swap for simplicity (in production, use Jupiter CPI)
    let actual_out_amount = swap_amount_after_fee;
    
    // Validate slippage
    require!(
        actual_out_amount >= intent.min_out,
        ErrorCode::SlippageExceeded
    );
    
    // Check relayer has sufficient balance for providing output tokens
    require!(
        ctx.accounts.relayer_token_out_account.amount >= actual_out_amount,
        ErrorCode::InsufficientBalance
    );
    
    // ==================== STATE UPDATE ====================
    
    stored.revealed = true;
    
    // ==================== ATOMIC SWAP EXECUTION ====================
    
    execute_atomic_swap(
        &ctx,  // Pass context
        &intent,
        actual_out_amount,
        protocol_fee,
    )?;
    
    // ==================== SUCCESS EVENT ====================
    
    emit!(TradeExecuted {
        user: intent.user,
        relayer: intent.relayer,
        token_in: intent.token_in,
        token_out: intent.token_out,
        amount_in: intent.amount_in,
        amount_out: actual_out_amount,
        protocol_fee,
        relayer_fee: intent.relayer_fee,
        nonce: intent.nonce,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Trade executed successfully. Protocol fee {} collected for distribution.", protocol_fee);
    
    Ok(())
}

// ==================== HELPER FUNCTIONS ====================

fn verify_ed25519_signature(
    instructions_sysvar: &AccountInfo,
    signature: &[u8; 64],
    user_pubkey: &[u8; 32],
    message_hash: &[u8; 32],
) -> Result<()> {
    // Load current instruction index
    let current_index = anchor_lang::solana_program::sysvar::instructions::load_current_index_checked(instructions_sysvar)?;
    
    // We expect an ed25519 instruction to be present before this instruction
    if current_index == 0 {
        return Err(ErrorCode::InvalidSignature.into());
    }
    
    // Load the previous instruction (should be ed25519 verification)
    let ed25519_ix_index = current_index.saturating_sub(1);
    let ed25519_ix = load_instruction_at_checked(ed25519_ix_index as usize, instructions_sysvar)?;
    
    // Verify it's an ed25519 instruction
    require_keys_eq!(ed25519_ix.program_id, ed25519_program::id(), ErrorCode::InvalidSignature);
    
    // Parse ed25519 instruction data
    let ix_data = &ed25519_ix.data;
    require!(ix_data.len() >= 1 + 64 + 32 + 2, ErrorCode::InvalidSignature);
    
    let num_signatures = ix_data[0];
    require!(num_signatures == 1, ErrorCode::InvalidSignature);
    
    let ix_signature = &ix_data[1..65];
    let ix_pubkey = &ix_data[65..97];
    let message_len = u16::from_le_bytes([ix_data[97], ix_data[98]]) as usize;
    
    require!(ix_data.len() >= 99 + message_len, ErrorCode::InvalidSignature);
    let ix_message = &ix_data[99..99 + message_len];
    
    // Verify signature matches
    require!(ix_signature == signature, ErrorCode::InvalidSignature);
    
    // Verify pubkey matches
    require!(ix_pubkey == user_pubkey, ErrorCode::InvalidSignature);
    
    // Verify message matches our hash
    require!(ix_message == message_hash, ErrorCode::InvalidSignature);
    
    msg!("ED25519 signature verified successfully for user: {:?}", user_pubkey);
    
    Ok(())
}

fn execute_atomic_swap(
    ctx: &Context<RevealTrade>,
    intent: &TradeIntentData,
    actual_out_amount: u64,
    protocol_fee: u64,
) -> Result<()> {
    // ==================== ATOMIC TRANSACTION PATTERN ====================
    
    // 1. Transfer input tokens from user to relayer (minus protocol fee)
    let user_to_relayer_amount = intent.amount_in
        .checked_sub(protocol_fee)
        .ok_or(ErrorCode::MathOverflow)?;
    
    let user_to_relayer_cpi = Transfer {
        from: ctx.accounts.user_token_in_account.to_account_info(),
        to: ctx.accounts.relayer_token_in_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), user_to_relayer_cpi),
        user_to_relayer_amount,
    ).map_err(|_| ErrorCode::SwapExecutionFailed)?;
    
    // 2. Transfer protocol fee to fee collection account
    if protocol_fee > 0 {
        let fee_cpi = Transfer {
            from: ctx.accounts.user_token_in_account.to_account_info(),
            to: ctx.accounts.fee_collection_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), fee_cpi),
            protocol_fee,
        ).map_err(|_| ErrorCode::SwapExecutionFailed)?;
    }
    
    // 3. Transfer output tokens from relayer to user
    let relayer_to_user_cpi = Transfer {
        from: ctx.accounts.relayer_token_out_account.to_account_info(),
        to: ctx.accounts.user_token_out_account.to_account_info(),
        authority: ctx.accounts.relayer.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), relayer_to_user_cpi),
        actual_out_amount,
    ).map_err(|_| ErrorCode::SwapExecutionFailed)?;
    
    // 4. Transfer relayer fee if specified
    if intent.relayer_fee > 0 {
        let relayer_fee_cpi = Transfer {
            from: ctx.accounts.user_token_out_account.to_account_info(),
            to: ctx.accounts.relayer_token_out_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), relayer_fee_cpi),
            intent.relayer_fee,
        ).map_err(|_| ErrorCode::SwapExecutionFailed)?;
    }
    
    // Log successful atomic swap
    msg!("Atomic swap completed successfully:");
    msg!("  Input: {} tokens of {}", intent.amount_in, intent.token_in);
    msg!("  Output: {} tokens of {}", actual_out_amount, intent.token_out);
    msg!("  Protocol fee: {}", protocol_fee);
    msg!("  Relayer fee: {}", intent.relayer_fee);
    
    Ok(())
}

// ==================== EVENTS ====================

#[event]
pub struct TradeExecuted {
    pub user: Pubkey,
    pub relayer: Pubkey,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub protocol_fee: u64,
    pub relayer_fee: u64,
    pub nonce: u64,
    pub timestamp: i64,
}