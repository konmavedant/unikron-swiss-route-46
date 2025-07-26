"use client"

import { useState, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { contractSwapService } from "@/services/contractSwapService"
import { useToast } from "@/hooks/use-toast"
import type { SwapQuote } from "@/types"

interface UseContractSwapReturn {
  executeContractSwap: (quote: SwapQuote) => Promise<string | null>
  initializeFeeAccounts: (tokenMintAddress: string) => Promise<string | null>
  checkFeeAccountsInitialized: (tokenMintAddress: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export const useContractSwap = (): UseContractSwapReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()

  const executeContractSwap = useCallback(
    async (quote: SwapQuote): Promise<string | null> => {
      if (!publicKey || !signTransaction) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your Solana wallet to proceed",
          variant: "destructive",
        })
        return null
      }

      if (!quote) {
        toast({
          title: "Invalid Quote",
          description: "Quote data is missing, please get a new quote",
          variant: "destructive",
        })
        return null
      }

      // Check if quote is still valid
      if (Date.now() > quote.validUntil) {
        toast({
          title: "Quote Expired",
          description: "Quote has expired, please get a new quote",
          variant: "destructive",
        })
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log("🚀 Starting contract-based swap...")
        console.log("📋 Swap details:", {
          inputToken: quote.inputToken.symbol,
          outputToken: quote.outputToken.symbol,
          inputAmount: quote.inputAmount,
          expectedOutput: quote.outputAmount,
          slippage: quote.slippage,
        })

        // Show initial toast
        toast({
          title: "Swap in Progress",
          description: "Executing commit-reveal swap protocol...",
        })

        // Check if fee accounts are initialized for both tokens
        const inputTokenMint = new PublicKey(quote.inputToken.address)
        const outputTokenMint = new PublicKey(quote.outputToken.address)

        // const inputFeeAccountsInitialized = await contractSwapService.areFeeAccountsInitialized(inputTokenMint)
        // const outputFeeAccountsInitialized = await contractSwapService.areFeeAccountsInitialized(outputTokenMint)

        // Initialize fee accounts if needed
        // if (!inputFeeAccountsInitialized) {
        //   console.log("🔧 Initializing fee accounts for input token...")
        //   toast({
        //     title: "Initializing",
        //     description: "Setting up fee accounts for input token...",
        //   })

        //   await contractSwapService.initializeFeeAccounts(inputTokenMint, publicKey, signTransaction)
        // }

        // if (!outputFeeAccountsInitialized) {
        //   console.log("🔧 Initializing fee accounts for output token...")
        //   toast({
        //     title: "Initializing",
        //     description: "Setting up fee accounts for output token...",
        //   })

        //   await contractSwapService.initializeFeeAccounts(outputTokenMint, publicKey, signTransaction)
        // }

        // Execute the swap using the contract
        const signature = await contractSwapService.executeSwap(quote, publicKey, signTransaction)

        console.log("🎉 Contract swap completed successfully!")
        console.log("📝 Transaction signature:", signature)

        toast({
          title: "Swap Successful",
          description: `Swap completed with MEV protection! Signature: ${signature.slice(0, 8)}...`,
        })

        return signature
      } catch (err) {
        console.error("❌ Contract swap execution error:", err)
        let errorMessage = "Contract swap failed"

        if (err instanceof Error) {
          if (err.message.includes("User rejected")) {
            errorMessage = "Transaction was rejected by user"
          } else if (err.message.includes("Insufficient funds")) {
            errorMessage = "Insufficient funds for transaction (including fees)"
          } else if (err.message.includes("AlreadyRevealed")) {
            errorMessage = "Trade intent already revealed, please try again"
          } else if (err.message.includes("IntentExpired")) {
            errorMessage = "Trade intent expired, please get a new quote"
          } else if (err.message.includes("SlippageExceeded")) {
            errorMessage = "Price moved too much, try increasing slippage tolerance"
          } else if (err.message.includes("InsufficientBalance")) {
            errorMessage = "Insufficient token balance"
          } else {
            errorMessage = err.message
          }
        }

        setError(errorMessage)

        toast({
          title: "Swap Failed",
          description: errorMessage,
          variant: "destructive",
        })

        return null
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, signTransaction, toast],
  )

  const initializeFeeAccounts = useCallback(
    async (tokenMintAddress: string): Promise<string | null> => {
      if (!publicKey || !signTransaction) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your Solana wallet to proceed",
          variant: "destructive",
        })
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const tokenMint = new PublicKey(tokenMintAddress)
        const signature = await contractSwapService.initializeFeeAccounts(tokenMint, publicKey, signTransaction)

        toast({
          title: "Initialization Successful",
          description: "Fee accounts initialized successfully",
        })

        return signature
      } catch (err) {
        console.error("❌ Fee account initialization failed:", err)
        const errorMessage = err instanceof Error ? err.message : "Initialization failed"
        setError(errorMessage)

        toast({
          title: "Initialization Failed",
          description: errorMessage,
          variant: "destructive",
        })

        return null
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, signTransaction, toast],
  )

  const checkFeeAccountsInitialized = useCallback(async (tokenMintAddress: string): Promise<boolean> => {
    try {
      const tokenMint = new PublicKey(tokenMintAddress)
      return await contractSwapService.areFeeAccountsInitialized(tokenMint)
    } catch {
      return false
    }
  }, [])

  return {
    executeContractSwap,
    initializeFeeAccounts,
    checkFeeAccountsInitialized,
    isLoading,
    error,
  }
}
