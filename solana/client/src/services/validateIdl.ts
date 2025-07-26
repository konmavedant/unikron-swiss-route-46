// idlValidator.ts

import { Idl } from "@project-serum/anchor";

// Function to validate and fix IDL structure
export function validateAndFixIdl(rawIdl: any): Idl {
  console.log("🔍 Validating IDL structure...");
  
  // Ensure all required fields are present
  const fixedIdl = {
    version: rawIdl.version || "0.1.0",
    name: rawIdl.metadata?.name || rawIdl.name || "unikron",
    instructions: rawIdl.instructions || [],
    accounts: rawIdl.accounts || [],
    types: rawIdl.types || [],
    events: rawIdl.events || [],
    errors: rawIdl.errors || [],
    constants: rawIdl.constants || [],
  };

  // Validate that TradeIntentData type exists
  const tradeIntentType = fixedIdl.types.find(
    (type: any) => type.name === "TradeIntentData"
  );

  if (!tradeIntentType) {
    console.error("❌ TradeIntentData type not found in IDL");
    console.log("Available types:", fixedIdl.types.map((t: any) => t.name));
    
    // Add the missing type definition
    fixedIdl.types.push({
      name: "TradeIntentData",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "publicKey" },
          { name: "nonce", type: "u64" },
          { name: "expiry", type: "u64" },
          { name: "relayer", type: "publicKey" },
          { name: "relayer_fee", type: "u64" },
          { name: "token_in", type: "publicKey" },
          { name: "token_out", type: "publicKey" },
          { name: "amount_in", type: "u64" },
          { name: "min_out", type: "u64" },
        ],
      },
    });
    
    console.log("✅ Added missing TradeIntentData type");
  } else {
    console.log("✅ TradeIntentData type found in IDL");
  }

  // Validate instruction parameters
  const revealTradeInstruction = fixedIdl.instructions.find(
    (inst: any) => inst.name === "reveal_trade"
  );

  if (revealTradeInstruction) {
    const intentArg = revealTradeInstruction.args?.find(
      (arg: any) => arg.name === "intent"
    );
    
    if (intentArg) {
      console.log("✅ Intent argument found in reveal_trade instruction");
      console.log("Intent arg type:", JSON.stringify(intentArg.type, null, 2));
    } else {
      console.error("❌ Intent argument not found in reveal_trade instruction");
    }
  }

  return fixedIdl as Idl;
}

// Alternative: Create IDL programmatically
export function createManualIdl(): Idl {
  return {
    version: "0.1.0",
    name: "unikron",
    instructions: [
      {
        name: "commitTrade",
        accounts: [
          {
            name: "swapIntent",
            isMut: true,
            isSigner: false,
          },
          {
            name: "user",
            isMut: true,
            isSigner: true,
          },
          {
            name: "systemProgram",
            isMut: false,
            isSigner: false,
          },
        ],
        args: [
          {
            name: "intentHash",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "nonce",
            type: "u64",
          },
          {
            name: "expiry",
            type: "u64",
          },
        ],
      },
      {
        name: "revealTrade",
        accounts: [
          {
            name: "swapIntent",
            isMut: true,
            isSigner: false,
          },
          {
            name: "user",
            isMut: true,
            isSigner: true,
          },
          {
            name: "instructionsSysvar",
            isMut: false,
            isSigner: false,
          },
          {
            name: "userTokenInAccount",
            isMut: true,
            isSigner: false,
          },
          {
            name: "userTokenOutAccount",
            isMut: true,
            isSigner: false,
          },
          {
            name: "relayerTokenInAccount",
            isMut: true,
            isSigner: false,
          },
          {
            name: "relayerTokenOutAccount",
            isMut: true,
            isSigner: false,
          },
          {
            name: "relayer",
            isMut: true,
            isSigner: true,
          },
          {
            name: "tokenInMint",
            isMut: false,
            isSigner: false,
          },
          {
            name: "tokenOutMint",
            isMut: false,
            isSigner: false,
          },
          {
            name: "feeCollectionAccount",
            isMut: true,
            isSigner: false,
          },
          {
            name: "feeCollectionAuthority",
            isMut: false,
            isSigner: false,
          },
          {
            name: "tokenProgram",
            isMut: false,
            isSigner: false,
          },
          {
            name: "systemProgram",
            isMut: false,
            isSigner: false,
          },
        ],
        args: [
          {
            name: "intent",
            type: {
              defined: "TradeIntentData",
            },
          },
          {
            name: "expectedHash",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "signature",
            type: {
              array: ["u8", 64],
            },
          },
        ],
      },
    ],
    accounts: [
      {
        name: "SwapIntent",
        type: {
          kind: "struct",
          fields: [
            {
              name: "user",
              type: "publicKey",
            },
            {
              name: "intentHash",
              type: {
                array: ["u8", 32],
              },
            },
            {
              name: "nonce",
              type: "u64",
            },
            {
              name: "expiry",
              type: "u64",
            },
            {
              name: "timestamp",
              type: "i64",
            },
            {
              name: "revealed",
              type: "bool",
            },
          ],
        },
      },
    ],
    types: [
      {
        name: "TradeIntentData",
        type: {
          kind: "struct",
          fields: [
            {
              name: "user",
              type: "publicKey",
            },
            {
              name: "nonce",
              type: "u64",
            },
            {
              name: "expiry",
              type: "u64",
            },
            {
              name: "relayer",
              type: "publicKey",
            },
            {
              name: "relayerFee",
              type: "u64",
            },
            {
              name: "tokenIn",
              type: "publicKey",
            },
            {
              name: "tokenOut",
              type: "publicKey",
            },
            {
              name: "amountIn",
              type: "u64",
            },
            {
              name: "minOut",
              type: "u64",
            },
          ],
        },
      },
    ],
    events: [],
    errors: [],
  } as Idl;
}


// Alternative: Create a minimal working IDL
export function createMinimalIdl(): Idl {
  return {
    version: "0.1.0",
    name: "unikron",
    instructions: [
      {
        name: "commitTrade",
        accounts: [
          { name: "swapIntent", isMut: true, isSigner: false },
          { name: "user", isMut: true, isSigner: true },
          { name: "systemProgram", isMut: false, isSigner: false },
        ],
        args: [
          { name: "intentHash", type: { array: ["u8", 32] } },
          { name: "nonce", type: "u64" },
          { name: "expiry", type: "u64" },
        ],
      },
      {
        name: "revealTrade",
        accounts: [
          { name: "swapIntent", isMut: true, isSigner: false },
          { name: "user", isMut: true, isSigner: true },
          { name: "instructionsSysvar", isMut: false, isSigner: false },
          { name: "userTokenInAccount", isMut: true, isSigner: false },
          { name: "userTokenOutAccount", isMut: true, isSigner: false },
          { name: "relayerTokenInAccount", isMut: true, isSigner: false },
          { name: "relayerTokenOutAccount", isMut: true, isSigner: false },
          { name: "relayer", isMut: true, isSigner: true },
          { name: "tokenInMint", isMut: false, isSigner: false },
          { name: "tokenOutMint", isMut: false, isSigner: false },
          { name: "feeCollectionAccount", isMut: true, isSigner: false },
          { name: "feeCollectionAuthority", isMut: false, isSigner: false },
          { name: "tokenProgram", isMut: false, isSigner: false },
          { name: "systemProgram", isMut: false, isSigner: false },
        ],
        args: [
          { name: "intent", type: { defined: "TradeIntentData" } },
          { name: "expectedHash", type: { array: ["u8", 32] } },
          { name: "signature", type: { array: ["u8", 64] } },
        ],
      },
    ],
    accounts: [
      {
        name: "swapIntent",
        type: {
          kind: "struct",
          fields: [
            { name: "user", type: "publicKey" },
            { name: "intent_hash", type: { array: ["u8", 32] } },
            { name: "nonce", type: "u64" },
            { name: "expiry", type: "u64" },
            { name: "timestamp", type: "i64" },
            { name: "revealed", type: "bool" },
          ],
        },
      },
    ],

    types: [
      {
        name: "TradeIntentData",
        type: {
          kind: "struct",
          fields: [
            { name: "user", type: "publicKey" },
            { name: "nonce", type: "u64" },
            { name: "expiry", type: "u64" },
            { name: "relayer", type: "publicKey" },
            { name: "relayerFee", type: "u64" },
            { name: "tokenIn", type: "publicKey" },
            { name: "tokenOut", type: "publicKey" },
            { name: "amountIn", type: "u64" },
            { name: "minOut", type: "u64" },
          ],
        },
      },
    ],
    events: [],
    errors: [],
  };
}