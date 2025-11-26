import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode
  trailingAction?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leadingIcon, trailingAction, ...props }, ref) => {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 ring-offset-background focus-within:ring-2 focus-within:ring-accent/60 focus-within:border-accent/60", className)}>
        {leadingIcon && <span className="text-muted-foreground/70">{leadingIcon}</span>}
        <input
          type={type}
          className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          ref={ref}
          {...props}
        />
        {trailingAction}
      </div>
    )
  }
)
Input.displayName = "Input"
