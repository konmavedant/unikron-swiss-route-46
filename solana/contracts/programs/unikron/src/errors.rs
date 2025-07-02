// programs/unikron/src/errors.rs

use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Intent already revealed")]
    AlreadyRevealed,

    #[msg("Trade intent expired")]
    IntentExpired,

    #[msg("Nonce does not match")]
    NonceMismatch,

    #[msg("Signature verification failed")]
    InvalidSignature,

    #[msg("Hash mismatch between reveal and commit")]
    HashMismatch,

    #[msg("Insufficient token balance")]
    InsufficientBalance,

    #[msg("Mathematical overflow occurred")]
    MathOverflow,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,

    #[msg("Invalid token mint")]
    InvalidTokenMint,

    #[msg("Relayer fee too high")]
    RelayerFeeTooHigh,

    #[msg("Protocol fee calculation failed")]
    ProtocolFeeError,

    #[msg("Fee distribution failed")]
    FeeDistributionError,

    #[msg("Swap execution failed")]
    SwapExecutionFailed,

    #[msg("Invalid relayer")]
    InvalidRelayer,

    #[msg("Trade amount too small")]
    AmountTooSmall,

    #[msg("Trade amount too large")]
    AmountTooLarge,
}