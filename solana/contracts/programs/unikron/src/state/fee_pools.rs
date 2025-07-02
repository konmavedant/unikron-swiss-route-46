use anchor_lang::prelude::*;

#[account]
pub struct FeePools {
    pub treasury: Pubkey,
    pub stakers: Pubkey,
    pub bounty: Pubkey,
    pub bump: u8,
}