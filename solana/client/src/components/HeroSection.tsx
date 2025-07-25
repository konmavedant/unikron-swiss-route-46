import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Globe, ArrowRight, Star, TrendingUp } from "lucide-react";

export  function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:60px_60px]"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative text-center space-y-8 max-w-5xl mx-auto px-6 z-10">
        {/* Swiss DLT Badge */}
        <div className="flex justify-center mb-6">
          <Badge 
            variant="outline" 
            className="text-blue-400 border-blue-400/50 bg-blue-900/20 backdrop-blur-sm px-4 py-2"
          >
            <Star className="w-3 h-3 mr-2" />
            Swiss DLT §5-Execution Layer
          </Badge>
        </div>
        
        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 bg-clip-text text-transparent">
              UNIKRON
            </span>
          </h1>
          
          <div className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            <span className="font-semibold text-white">MEV-optimized routing</span> across{" "}
            <span className="text-blue-400 font-semibold">Solana & EVM</span>, with{" "}
            <span className="text-blue-300 font-semibold">multi-chain expansion</span> underway
          </div>
        </div>
        
        {/* Feature Highlights */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-400/30 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">Swiss-Grade Protection</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-400/30 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-blue-300" />
            <span className="text-slate-300">Optimal Execution</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-400/30 backdrop-blur-sm">
            <Globe className="w-4 h-4 text-blue-200" />
            <span className="text-slate-300">Cross-Chain Future</span>
          </div>
        </div>
        
        {/* MEV Protection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-400/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-400">99.7%</div>
            <div className="text-sm text-slate-300">MEV Protection Rate</div>
            <div className="text-xs text-slate-400 mt-1">Last 30 days</div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-400/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-300">$2.1M</div>
            <div className="text-sm text-slate-300">MEV Value Protected</div>
            <div className="text-xs text-slate-400 mt-1">User savings</div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-400/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-200">847</div>
            <div className="text-sm text-slate-300">Attacks Prevented</div>
            <div className="text-xs text-slate-400 mt-1">This week</div>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            size="lg" 
            className="text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-0 shadow-lg shadow-blue-600/25 text-white flex items-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Start Protected Trading
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="text-base border-blue-400/50 text-blue-400 hover:bg-blue-900/20 backdrop-blur-sm"
          >
            View Execution Proofs
          </Button>
        </div>
        
        {/* Swiss Compliance Notice */}
        <div className="pt-6 border-t border-blue-400/20">
          <p className="text-xs text-slate-400 max-w-2xl mx-auto">
            Compliant with Swiss Digital Ledger Technology regulations. 
            All transactions are verifiable through ZK-proofs and maintain full audit trails.
          </p>
        </div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/6 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/6 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
    </div>
  );
}