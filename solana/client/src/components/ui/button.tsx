// Enhanced button.tsx with Swiss DLT theme
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-primary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Swiss DLT themed variants
        cosmic: "bg-gradient-to-r from-[#0f4c75] to-[#3282b8] text-white hover:from-[#1565c0] hover:to-[#42a5f5] shadow-lg shadow-[#0f4c75]/25 border-0 transition-all duration-300",
        shield: "bg-gradient-to-r from-[#059669] to-[#10b981] text-white hover:from-[#047857] hover:to-[#059669] shadow-lg shadow-green-500/25 border-0 transition-all duration-300",
        
        // Swiss precision variants
        swiss: "bg-[#0f4c75] text-white hover:bg-[#1565c0] border border-[#3282b8]/30 shadow-md hover:shadow-glow-primary transition-all duration-300",
        "swiss-outline": "border-2 border-[#3282b8] text-[#3282b8] bg-transparent hover:bg-[#0f4c75]/10 hover:border-[#42a5f5] transition-all duration-300",
        "swiss-ghost": "text-[#3282b8] hover:bg-[#0f4c75]/10 hover:text-[#42a5f5] transition-all duration-300",
        
        // MEV protection specific
        "mev-protected": "bg-gradient-to-r from-[#0f4c75] via-[#3282b8] to-[#5dade2] text-white hover:scale-105 shadow-xl shadow-[#0f4c75]/30 border-0 transition-all duration-300 animate-protection-pulse",
        "audit-proof": "bg-gradient-to-r from-[#1e293b] to-[#0f4c75] text-[#a5b4cb] hover:text-white border border-[#3282b8]/40 hover:border-[#3282b8] transition-all duration-300",
        
        // Status variants
        success: "bg-gradient-to-r from-[#059669] to-[#10b981] text-white hover:from-[#047857] hover:to-[#059669] shadow-md transition-all duration-300",
        warning: "bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white hover:from-[#b45309] hover:to-[#d97706] shadow-md transition-all duration-300",
        error: "bg-gradient-to-r from-[#dc2626] to-[#ef4444] text-white hover:from-[#b91c1c] hover:to-[#dc2626] shadow-md transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// Usage examples:
/*
// Swiss DLT themed buttons
<Button variant="swiss" size="lg">
  <Shield className="w-4 h-4" />
  Swiss Protected Trade
</Button>

<Button variant="mev-protected" size="xl">
  <TrendingUp className="w-5 h-5" />
  Execute MEV-Protected Swap
</Button>

<Button variant="audit-proof" size="lg">
  <ExternalLink className="w-4 h-4" />
  View ZK Execution Proofs
</Button>

<Button variant="swiss-outline">
  <Clock className="w-4 h-4" />
  Schedule Execution
</Button>

// Status buttons for different states
<Button variant="success" size="sm">
  <CheckCircle className="w-4 h-4" />
  Verified
</Button>

<Button variant="warning" size="sm">
  <AlertTriangle className="w-4 h-4" />
  High Slippage
</Button>

<Button variant="error" size="sm">
  <XCircle className="w-4 h-4" />
  Failed
</Button>
*/