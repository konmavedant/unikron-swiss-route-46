import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Globe, ArrowRight } from "lucide-react";
import cosmicBackground from "@/assets/cosmic-background.jpg";
export const HeroSection = () => {
  return <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl" style={{
    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${cosmicBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}>
      <div className="absolute inset-0 bg-gradient-background/80"></div>
      
      <div className="relative text-center space-y-6 max-w-4xl mx-auto px-6">
        <div className="flex justify-center mb-4">
          <Badge variant="outline" className="text-shield-cyan border-shield-cyan/50 bg-shield-cyan/5">
            <Shield className="w-3 h-3 mr-1" />
            MEV-Protected Cross-Chain DEX Aggregator
          </Badge>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold">
          <span className="bg-gradient-cosmic bg-clip-text text-transparent">
            UNIKRON
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto">
          The next-generation DEX aggregator with commit-reveal MEV protection 
          across <span className="text-shield-cyan font-semibold">EVM</span> and{" "}
          <span className="text-cosmic-secondary font-semibold">Solana</span> chains
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 border border-border/30">
            <Shield className="w-4 h-4 text-shield-cyan" />
            <span>MEV Protection</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 border border-border/30">
            <Zap className="w-4 h-4 text-primary" />
            <span>Best Rates</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="cosmic" size="lg" className="text-base font-semibold">
            <Zap className="w-5 h-5" />
            Start Trading
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg" className="text-base">
            Learn More
          </Button>
        </div>
      </div>
      
      {/* Animated glow effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cosmic-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-shield-cyan/20 rounded-full blur-3xl animate-pulse" style={{
      animationDelay: '1s'
    }}></div>
    </div>;
};