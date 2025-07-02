use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct SwapIntent {
    pub user: Pubkey,
    pub intent_hash: [u8; 32],
    pub nonce: u64,
    pub expiry: u64,
    pub timestamp: i64,
    pub revealed: bool,
}

impl SwapIntent {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TradeIntentData {
    pub user: Pubkey,
    pub nonce: u64,
    pub expiry: u64,
    pub relayer: Pubkey,
    pub relayer_fee: u64,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount_in: u64,
    pub min_out: u64,
}