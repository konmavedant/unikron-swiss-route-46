#![allow(deprecated)]
use anchor_lang::prelude::*;

declare_id!("2bgpPzHUWu9jRAMUcF2Kex4dKti6U554hkhpkBi4EpHK");

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::commit_trade::{CommitTrade, handle_commit};
use instructions::reveal_trade::{RevealTrade, handle_reveal};
use instructions::settle_trade::{SettleFee, InitializeFeeAccounts, handler as handle_settle, initialize_fee_accounts};

use state::{SwapIntent, TradeIntentData};

use instructions::*;
use state::*;

#[program]
pub mod unikron {
    use super::*;

    /// Initialize fee accounts for a specific token mint
    pub fn initialize_fee_accounts(
        ctx: Context<InitializeFeeAccounts>,
    ) -> Result<()> {
        instructions::settle_trade::initialize_fee_accounts(ctx)
    }

    /// Commit a trade intent hash to the blockchain
    pub fn commit_trade(
        ctx: Context<CommitTrade>,
        intent_hash: [u8; 32],
        nonce: u64,
        expiry: u64,
    ) -> Result<()> {
        handle_commit(ctx, intent_hash, nonce, expiry)
    }

    /// Reveal and execute a committed trade
    pub fn reveal_trade(
        ctx: Context<RevealTrade>,
        intent: TradeIntentData,
        expected_hash: [u8; 32],
        signature: [u8; 64],
    ) -> Result<()> {
        handle_reveal(ctx, intent, expected_hash, signature)
    }

    /// Distribute collected fees to different pools
    pub fn settle_trade(
        ctx: Context<SettleFee>, 
        fee_amount: u64
    ) -> Result<()> {
        handle_settle(ctx, fee_amount)
    }
}