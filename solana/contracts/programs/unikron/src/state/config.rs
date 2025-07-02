use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub fee_bps: u16,
    pub is_paused: bool,
    pub bump: u8,
}