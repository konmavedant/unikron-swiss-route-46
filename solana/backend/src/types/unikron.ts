/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/unikron.json`.
 */
export type Unikron = {
  "address": "2bgpPzHUWu9jRAMUcF2Kex4dKti6U554hkhpkBi4EpHK",
  "metadata": {
    "name": "unikron",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "commitTrade",
      "docs": [
        "Commit a trade intent hash to the blockchain"
      ],
      "discriminator": [
        225,
        172,
        49,
        43,
        30,
        198,
        216,
        89
      ],
      "accounts": [
        {
          "name": "swapIntent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  116,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "intentHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "expiry",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeFeeAccounts",
      "docs": [
        "Initialize fee accounts for a specific token mint"
      ],
      "discriminator": [
        233,
        63,
        142,
        11,
        168,
        28,
        143,
        222
      ],
      "accounts": [
        {
          "name": "feeCollectionAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "liquidityStakerAccount",
          "docs": [
            "Initialize liquidity stakers fee account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  95,
                  115,
                  116,
                  97,
                  107,
                  101,
                  114,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "treasuryAccount",
          "docs": [
            "Initialize treasury fee account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "bountyAccount",
          "docs": [
            "Initialize MEV bounty fee account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  118,
                  95,
                  98,
                  111,
                  117,
                  110,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "feeCollectionAccount",
          "docs": [
            "Initialize fee collection account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  108,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "tokenMint",
          "docs": [
            "The token mint for the fee accounts"
          ]
        },
        {
          "name": "payer",
          "docs": [
            "Payer for account creation"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revealTrade",
      "docs": [
        "Reveal and execute a committed trade"
      ],
      "discriminator": [
        72,
        86,
        206,
        182,
        223,
        187,
        228,
        226
      ],
      "accounts": [
        {
          "name": "swapIntent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  116,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "swap_intent.nonce",
                "account": "swapIntent"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true,
          "relations": [
            "swapIntent"
          ]
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "userTokenInAccount",
          "writable": true
        },
        {
          "name": "userTokenOutAccount",
          "writable": true
        },
        {
          "name": "relayerTokenInAccount",
          "writable": true
        },
        {
          "name": "relayerTokenOutAccount",
          "writable": true
        },
        {
          "name": "relayer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenInMint"
        },
        {
          "name": "tokenOutMint"
        },
        {
          "name": "feeCollectionAccount",
          "writable": true
        },
        {
          "name": "feeCollectionAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "intent",
          "type": {
            "defined": {
              "name": "tradeIntentData"
            }
          }
        },
        {
          "name": "expectedHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "signature",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        }
      ]
    },
    {
      "name": "settleTrade",
      "docs": [
        "Distribute collected fees to different pools"
      ],
      "discriminator": [
        252,
        176,
        98,
        248,
        73,
        123,
        8,
        157
      ],
      "accounts": [
        {
          "name": "feeCollectionAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "sourceFeeAccount",
          "docs": [
            "The token account that holds collected protocol fees"
          ],
          "writable": true
        },
        {
          "name": "liquidityStakerAccount",
          "docs": [
            "Token account for liquidity stakers (50% of fees)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  95,
                  115,
                  116,
                  97,
                  107,
                  101,
                  114,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "source_fee_account.mint",
                "account": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "treasuryAccount",
          "docs": [
            "Token account for protocol treasury (30% of fees)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "source_fee_account.mint",
                "account": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "bountyAccount",
          "docs": [
            "Token account for MEV bounty pool (20% of fees)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  118,
                  95,
                  98,
                  111,
                  117,
                  110,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "source_fee_account.mint",
                "account": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "tokenMint",
          "docs": [
            "The token mint for the fees being distributed"
          ]
        },
        {
          "name": "caller",
          "docs": [
            "Relayer or authorized caller who triggers fee distribution"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "feeAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "swapIntent",
      "discriminator": [
        242,
        212,
        249,
        216,
        109,
        94,
        238,
        134
      ]
    }
  ],
  "events": [
    {
      "name": "feeAccountsInitialized",
      "discriminator": [
        24,
        244,
        176,
        43,
        165,
        149,
        67,
        124
      ]
    },
    {
      "name": "feeDistributed",
      "discriminator": [
        6,
        133,
        116,
        50,
        44,
        151,
        179,
        65
      ]
    },
    {
      "name": "tradeExecuted",
      "discriminator": [
        41,
        110,
        64,
        129,
        60,
        79,
        179,
        80
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyRevealed",
      "msg": "Intent already revealed"
    },
    {
      "code": 6001,
      "name": "intentExpired",
      "msg": "Trade intent expired"
    },
    {
      "code": 6002,
      "name": "nonceMismatch",
      "msg": "Nonce does not match"
    },
    {
      "code": 6003,
      "name": "invalidSignature",
      "msg": "Signature verification failed"
    },
    {
      "code": 6004,
      "name": "hashMismatch",
      "msg": "Hash mismatch between reveal and commit"
    },
    {
      "code": 6005,
      "name": "insufficientBalance",
      "msg": "Insufficient token balance"
    },
    {
      "code": 6006,
      "name": "mathOverflow",
      "msg": "Mathematical overflow occurred"
    },
    {
      "code": 6007,
      "name": "slippageExceeded",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6008,
      "name": "invalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6009,
      "name": "relayerFeeTooHigh",
      "msg": "Relayer fee too high"
    },
    {
      "code": 6010,
      "name": "protocolFeeError",
      "msg": "Protocol fee calculation failed"
    },
    {
      "code": 6011,
      "name": "feeDistributionError",
      "msg": "Fee distribution failed"
    },
    {
      "code": 6012,
      "name": "swapExecutionFailed",
      "msg": "Swap execution failed"
    },
    {
      "code": 6013,
      "name": "invalidRelayer",
      "msg": "Invalid relayer"
    },
    {
      "code": 6014,
      "name": "amountTooSmall",
      "msg": "Trade amount too small"
    },
    {
      "code": 6015,
      "name": "amountTooLarge",
      "msg": "Trade amount too large"
    }
  ],
  "types": [
    {
      "name": "feeAccountsInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "feeAuthority",
            "type": "pubkey"
          },
          {
            "name": "liquidityStakers",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "mevBounty",
            "type": "pubkey"
          },
          {
            "name": "feeCollection",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "feeDistributed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "totalFee",
            "type": "u64"
          },
          {
            "name": "liquidityStakersFee",
            "type": "u64"
          },
          {
            "name": "treasuryFee",
            "type": "u64"
          },
          {
            "name": "mevBountyFee",
            "type": "u64"
          },
          {
            "name": "caller",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "swapIntent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "intentHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "revealed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "tradeExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "relayer",
            "type": "pubkey"
          },
          {
            "name": "tokenIn",
            "type": "pubkey"
          },
          {
            "name": "tokenOut",
            "type": "pubkey"
          },
          {
            "name": "amountIn",
            "type": "u64"
          },
          {
            "name": "amountOut",
            "type": "u64"
          },
          {
            "name": "protocolFee",
            "type": "u64"
          },
          {
            "name": "relayerFee",
            "type": "u64"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tradeIntentData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "u64"
          },
          {
            "name": "relayer",
            "type": "pubkey"
          },
          {
            "name": "relayerFee",
            "type": "u64"
          },
          {
            "name": "tokenIn",
            "type": "pubkey"
          },
          {
            "name": "tokenOut",
            "type": "pubkey"
          },
          {
            "name": "amountIn",
            "type": "u64"
          },
          {
            "name": "minOut",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
