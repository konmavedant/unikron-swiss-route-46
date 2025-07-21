import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Globe, ArrowRight, Star, TrendingUp } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="relative min-h-[500px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1419] via-[#1e293b] to-[#0f4c75]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-repeat"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative text-center space-y-8 max-w-5xl mx-auto px-6 z-10">
        {/* Swiss DLT Badge */}
        <div className="flex justify-center mb-6">
          <Badge 
            variant="outline" 
            className="text-[#3282b8] border-[#3282b8]/50 bg-[#0f4c75]/20 backdrop-blur-sm px-4 py-2"
          >
            <Star className="w-3 h-3 mr-2" />
            Swiss DLT §5-Execution Layer
          </Badge>
        </div>
        
        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-[#3282b8] via-[#5dade2] to-[#85c1e9] bg-clip-text text-transparent">
              UNIKRON
            </span>
          </h1>
          
          <div className="text-xl md:text-2xl text-[#a5b4cb] max-w-4xl mx-auto leading-relaxed">
            <span className="font-semibold text-white">MEV-optimized routing</span> across{" "}
            <span className="text-[#3282b8] font-semibold">Solana & EVM</span>, with{" "}
            <span className="text-[#5dade2] font-semibold">multi-chain expansion</span> underway
          </div>
        </div>
        
        {/* Feature Highlights */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f4c75]/30 border border-[#3282b8]/30 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-[#3282b8]" />
            <span className="text-[#a5b4cb]">Swiss-Grade Protection</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f4c75]/30 border border-[#3282b8]/30 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-[#5dade2]" />
            <span className="text-[#a5b4cb]">Optimal Execution</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f4c75]/30 border border-[#3282b8]/30 backdrop-blur-sm">
            <Globe className="w-4 h-4 text-[#85c1e9]" />
            <span className="text-[#a5b4cb]">Cross-Chain Future</span>
          </div>
        </div>
        
        {/* MEV Protection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-4 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#3282b8]">99.7%</div>
            <div className="text-sm text-[#a5b4cb]">MEV Protection Rate</div>
            <div className="text-xs text-[#6b7280] mt-1">Last 30 days</div>
          </div>
          
          <div className="p-4 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#5dade2]">$2.1M</div>
            <div className="text-sm text-[#a5b4cb]">MEV Value Protected</div>
            <div className="text-xs text-[#6b7280] mt-1">User savings</div>
          </div>
          
          <div className="p-4 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#85c1e9]">847</div>
            <div className="text-sm text-[#a5b4cb]">Attacks Prevented</div>
            <div className="text-xs text-[#6b7280] mt-1">This week</div>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            size="lg" 
            className="text-base font-semibold bg-gradient-to-r from-[#0f4c75] to-[#3282b8] hover:from-[#1565c0] hover:to-[#42a5f5] border-0 shadow-lg shadow-[#0f4c75]/25"
          >
            <Shield className="w-5 h-5" />
            Start Protected Trading
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="text-base border-[#3282b8]/50 text-[#3282b8] hover:bg-[#0f4c75]/20 backdrop-blur-sm"
          >
            View Execution Proofs
          </Button>
        </div>
        
        {/* Swiss Compliance Notice */}
        <div className="pt-6 border-t border-[#3282b8]/20">
          <p className="text-xs text-[#6b7280] max-w-2xl mx-auto">
            Compliant with Swiss Digital Ledger Technology regulations. 
            All transactions are verifiable through ZK-proofs and maintain full audit trails.
          </p>
        </div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/6 w-32 h-32 bg-[#0f4c75]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/6 w-40 h-40 bg-[#3282b8]/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-[#5dade2]/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
    </div>
  );
};