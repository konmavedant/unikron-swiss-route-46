// src/components/swap/SwapForm.tsx (Updated)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ArrowDownUp, Shield, Zap, Settings } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { TokenSelector } from "./TokenSelector";
import { SwapQuoteDisplay } from "./SwapQuoteDisplay";
import { Token, SwapQuote, ChainType } from "@/types";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useSolanaSwap } from "@/hooks/useSolanaSwap";
import { useSwapStore } from "@/store/swap";
import { TokenBalanceDisplay } from "./TokenBalanceDisplay";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useWalletStore } from "@/store/wallet";
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

interface SwapFormProps {
  tokens: Token[];
  isConnected: boolean;
  onPreview: () => void;
}

export const SwapForm = ({
  tokens,
  onPreview,
  isConnected
}: SwapFormProps) => {
  // Local state for MEV protection and settings
  const [mevProtection, setMevProtection] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global swap state
  const {
    chainType,
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    quote,
    config,
    isLoadingQuote,
    setInputToken,
    setOutputToken,
    setInputAmount,
    setConfig,
    setQuote,
    setLoadingQuote,
    swapTokens: swapTokenPositions,
  } = useSwapStore();


  console.log('====================================');
  console.log(outputToken,"output token******************************************************************************************");
  console.log('====================================');

  // Wallet connections
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { publicKey: solanaAddress, connected: solanaConnected } = useWallet();
  const { address: storeAddress, chainType: storeChainType } = useWalletStore();

  // Solana-specific swap functionality
  const { 
    getQuote: getSolanaQuote, 
    executeSwap: executeSolanaSwap,
    isLoading: isSolanaLoading 
  } = useSolanaSwap();

  // Determine if wallet is connected for current chain
  const isWalletConnected = useMemo(() => {
    if (chainType === 'evm') {
      return evmConnected && !!evmAddress;
    } else {
      return solanaConnected && !!solanaAddress;
    }
  }, [chainType, evmConnected, evmAddress, solanaConnected, solanaAddress]);

  // Get current wallet address
  const currentWalletAddress = useMemo(() => {
    if (chainType === 'evm' && evmAddress) {
      return evmAddress;
    } else if (chainType === 'solana' && solanaAddress) {
      return solanaAddress.toString();
    }
    return null;
  }, [chainType, evmAddress, solanaAddress]);

  const { handleError } = useErrorHandler();

  // Update MEV protection in config
  useEffect(() => {
    setConfig({ mevProtection });
  }, [mevProtection, setConfig]);

  // Custom quote fetching for Solana using Jupiter
  useEffect(() => {
    const fetchQuote = async () => {
      if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) === 0) {
        setQuote(null);
        return;
      }

      if (chainType === 'solana') {
        setLoadingQuote(true);
        try {
          const solanaQuote = await getSolanaQuote(
            inputToken,
            outputToken,
            inputAmount,
            config.slippage
          );
          setQuote(solanaQuote);
        } catch (error) {
          handleError(error);
          setQuote(null);
        } finally {
          setLoadingQuote(false);
        }
      }
      // For EVM chains, use the existing useSwapQuote hook
    };

    // Debounce the quote fetching
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [
    chainType,
    inputToken,
    outputToken,
    inputAmount,
    config.slippage,
    getSolanaQuote,
    setQuote,
    setLoadingQuote,
    handleError
  ]);

  const handlePreview = () => {
    if (hasValidInputs && quote) {
      onPreview();
    }
  };

  const handleDirectSwap = async () => {
    if (!quote || chainType !== 'solana') return;

    try {
      setLoadingQuote(true);
      const signature = await executeSolanaSwap(quote);
      
      if (signature) {
        // Handle successful swap
        console.log('Swap successful:', signature);
        // Reset form or show success message
        setInputAmount('');
        setQuote(null);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingQuote(false);
    }
  };

  // Check if we have valid inputs for quoting
  const hasValidInputs = useMemo(() => {
    return !!(inputToken && outputToken && inputAmount && parseFloat(inputAmount) > 0);
  }, [inputToken, outputToken, inputAmount]);

  // Check if we can show the swap button
  const canShowSwapButton = useMemo(() => {
    return isWalletConnected && hasValidInputs && !isLoadingQuote && !isSolanaLoading;
  }, [isWalletConnected, hasValidInputs, isLoadingQuote, isSolanaLoading]);

  const isLoading = isLoadingQuote || isSolanaLoading;

  return (
    <Card className="w-full max-w-md mx-auto shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Swap Tokens</CardTitle>
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background border shadow-lg" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={config.slippage === 0.1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ slippage: 0.1 })}
                    >
                      0.1%
                    </Button>
                    <Button
                      variant={config.slippage === 0.5 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ slippage: 0.5 })}
                    >
                      0.5%
                    </Button>
                    <Button
                      variant={config.slippage === 1.0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ slippage: 1.0 })}
                    >
                      1.0%
                    </Button>
                  </div>
                  <Input
                    id="slippage"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={config.slippage}
                    onChange={(e) => setConfig({ slippage: parseFloat(e.target.value) || 0.5 })}
                    placeholder="Custom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Transaction Deadline (minutes)</Label>
                  <Input
                    id="deadline"
                    type="number"
                    min="1"
                    max="60"
                    value={config.deadline}
                    onChange={(e) => setConfig({ deadline: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-shield-cyan" />
            <span className="text-sm font-medium">MEV Protection</span>
            {chainType === 'solana' && (
              <Badge variant="outline" className="text-xs">
                Unikron
              </Badge>
            )}
          </div>
          <Switch
            checked={mevProtection}
            onCheckedChange={setMevProtection}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">From</span>
            <TokenBalanceDisplay
              token={inputToken}
              chainType={chainType}
              isConnected={isWalletConnected}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="text-lg h-12 overflow-hidden"
                disabled={!isWalletConnected}
              />
            </div>
            <TokenSelector
              selectedToken={inputToken}
              onTokenSelect={setInputToken}
              chainType={chainType}
              label="Select Token"
              disabled={!isWalletConnected}
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border/50"
            onClick={swapTokenPositions}
            disabled={!isWalletConnected}
          >
            <ArrowDownUp className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">To</span>
            <TokenBalanceDisplay
              token={outputToken}
              chainType={chainType}
              isConnected={isWalletConnected}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={quote?.outputAmount ? (parseFloat(quote.outputAmount) / Math.pow(10, quote.outputToken.decimals)).toFixed(6) : ''}
                className="text-lg h-12"
                readOnly
                disabled={!isWalletConnected}
              />
            </div>
            <TokenSelector
              selectedToken={outputToken}
              onTokenSelect={setOutputToken}
              chainType={chainType}
              label="Select Token"
              disabled={!isWalletConnected}
            />
          </div>
        </div>

        {/* Quote Display */}
        <SwapQuoteDisplay
          quote={quote}
          isLoading={isLoading}
          mevProtection={mevProtection}
        />

        {/* MEV Protection Info */}
        {mevProtection && (
          <div className="p-3 rounded-lg bg-shield-cyan/5 border border-shield-cyan/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-shield-cyan" />
              <span className="text-sm font-medium text-shield-cyan">
                {chainType === 'solana' ? 'Jupiter Protection' : 'MEV Protection Active'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {chainType === 'solana' 
                ? 'Your swap will use Jupiter aggregator for best execution and protection.'
                : 'Your swap will use commit-reveal protocol to prevent front-running and MEV attacks.'
              }
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {chainType === 'solana' && quote ? (
            // Direct swap for Solana using Jupiter
            <Button
              variant="cosmic"
              className="w-full h-12 text-base font-semibold"
              disabled={!canShowSwapButton}
              onClick={handleDirectSwap}
            >
              {!isWalletConnected ? (
                "Connect Wallet"
              ) : !inputToken || !outputToken ? (
                "Select Tokens"
              ) : !inputAmount ? (
                "Enter Amount"
              ) : isLoading ? (
                "Getting Quote..."
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Swap
                </>
              )}
            </Button>
          ) : (
            // Preview for EVM or when no quote
            <Button
              variant={mevProtection ? "default" : "secondary"}
              className="w-full h-12 text-base font-semibold"
              disabled={!canShowSwapButton || !quote}
              onClick={handlePreview}
            >
              {!isWalletConnected ? (
                "Connect Wallet"
              ) : !inputToken || !outputToken ? (
                "Select Tokens"
              ) : !inputAmount ? (
                "Enter Amount"
              ) : isLoading ? (
                "Getting Quote..."
              ) : mevProtection ? (
                <>
                  <Shield className="w-4 h-4" />
                  Preview Protected Swap
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Preview Swap
                </>
              )}
            </Button>
          )}

          {/* Chain-specific info */}
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              {chainType === 'evm' ? 'EVM Compatible' : 'Solana Network'} • 
              {chainType === 'solana' ? ' Unikron Powered' : ' MEV Protected'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};