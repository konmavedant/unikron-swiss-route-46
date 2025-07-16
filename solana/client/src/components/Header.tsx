import { Button } from "@/components/ui/button";
import { Shield, Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import unikronLogo from "@/assets/unikron-logo.png";
export const Header = () => {
  const location = useLocation();
  return <header className="flex items-center justify-between p-6 border-b border-border/50">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={unikronLogo} alt="UNIKRON" className="w-10 h-10" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
              UNIKRON
            </h1>
            <p className="text-xs text-muted-foreground">Cross-Chain DEX Aggregator</p>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
            Trade
          </Link>
          <Link to="/history" className={`text-sm font-medium transition-colors ${location.pathname === '/history' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
            History
          </Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        
        
        
      </div>
    </header>;
};