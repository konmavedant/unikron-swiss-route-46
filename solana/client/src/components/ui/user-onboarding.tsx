import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ChevronRight, 
  Check, 
  Shield, 
  Info, 
  ArrowRight,
  X,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { useAppStore } from '@/store/app';
import { useWalletStore } from '@/store/wallet';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  optional?: boolean;
}

interface UserOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const UserOnboarding = ({ onComplete, onSkip }: UserOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { isConnected } = useWalletStore();
  const { settings, updateSettings } = useAppStore();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to UNIKRON',
      description: 'Your MEV-protected cross-chain DEX aggregator',
      icon: <Sparkles className="w-6 h-6 text-cosmic-secondary" />,
      completed: true,
    },
    {
      id: 'connect-wallet',
      title: 'Connect Your Wallet',
      description: 'Connect your wallet to start trading securely',
      icon: <Wallet className="w-6 h-6 text-primary" />,
      completed: isConnected,
    },
    {
      id: 'mev-protection',
      title: 'MEV Protection',
      description: 'Learn about our commit-reveal protection system',
      icon: <Shield className="w-6 h-6 text-shield-cyan" />,
      completed: false,
      optional: true,
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Customize slippage, deadlines, and other settings',
      icon: <HelpCircle className="w-6 h-6 text-yellow-500" />,
      completed: false,
      optional: true,
    },
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    updateSettings({ hasCompletedOnboarding: true });
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 300);
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-cosmic-secondary">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedSteps} of {steps.length} steps completed
              </p>
            </div>

            <div className="flex justify-center mb-4">
              {currentStepData.icon}
            </div>
            
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step Content */}
            <div className="min-h-[200px] flex items-center justify-center">
              {currentStep === 0 && <WelcomeStep />}
              {currentStep === 1 && <ConnectWalletStep />}
              {currentStep === 2 && <MEVProtectionStep />}
              {currentStep === 3 && <PreferencesStep />}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : handleSkip()}
              >
                {currentStep > 0 ? 'Previous' : 'Skip Tour'}
              </Button>

              <div className="flex gap-2">
                {currentStepData.optional && (
                  <Button variant="outline" onClick={handleNext}>
                    Skip
                  </Button>
                )}
                <Button onClick={handleNext} variant="cosmic">
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 pt-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    index === currentStep 
                      ? "bg-primary scale-125" 
                      : step.completed 
                      ? "bg-green-500" 
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const WelcomeStep = () => (
  <div className="text-center space-y-4">
    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
      <div className="p-4 rounded-lg bg-gradient-cosmic/10 border border-cosmic-secondary/20">
        <Shield className="w-8 h-8 text-shield-cyan mx-auto mb-2" />
        <p className="text-sm font-medium">MEV Protected</p>
      </div>
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <ArrowRight className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="text-sm font-medium">Cross-Chain</p>
      </div>
      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-sm font-medium">Best Rates</p>
      </div>
    </div>
    <p className="text-muted-foreground">
      UNIKRON provides secure, cross-chain swapping with advanced MEV protection 
      and the best rates across multiple DEXes.
    </p>
  </div>
);

const ConnectWalletStep = () => {
  const { isConnected } = useWalletStore();
  
  return (
    <div className="text-center space-y-4">
      {isConnected ? (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-green-600 font-medium">Wallet Connected Successfully!</p>
          <p className="text-muted-foreground">
            You can now start trading with full MEV protection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Connect your wallet using the button in the top-right corner to start trading.
          </p>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Info className="w-5 h-5 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-700">
              We support MetaMask, Phantom, and other popular wallets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const MEVProtectionStep = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <h4 className="font-medium text-red-600 mb-2">Without Protection</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Front-running attacks</li>
          <li>• Sandwich attacks</li>
          <li>• MEV extraction</li>
        </ul>
      </div>
      <div className="p-4 rounded-lg bg-shield-cyan/10 border border-shield-cyan/20">
        <h4 className="font-medium text-shield-cyan mb-2">With UNIKRON</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Commit-reveal protocol</li>
          <li>• Hidden intentions</li>
          <li>• Guaranteed execution</li>
        </ul>
      </div>
    </div>
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        Our commit-reveal system protects your trades from MEV attacks while ensuring fair execution.
      </p>
    </div>
  </div>
);

const PreferencesStep = () => {
  const { settings, updateSettings } = useAppStore();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Slippage Tolerance</h4>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={settings.slippageTolerance === value ? "default" : "outline"}
                onClick={() => updateSettings({ slippageTolerance: value })}
              >
                {value}%
              </Button>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg border">
          <h4 className="font-medium mb-2">MEV Protection</h4>
          <Button
            size="sm"
            variant={settings.mevProtectionDefault ? "shield" : "outline"}
            onClick={() => updateSettings({ mevProtectionDefault: !settings.mevProtectionDefault })}
            className="w-full"
          >
            {settings.mevProtectionDefault ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        You can change these settings anytime in the app preferences.
      </p>
    </div>
  );
};