"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-50 bg-background rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { className?: string }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-full max-w-2xl rounded-lg border bg-background p-6 shadow-lg",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className, 
  children 
}) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
    {children}
  </div>
)

const DialogTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className, 
  children 
}) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {children}
  </h2>
)

const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; onClick?: () => void }> = ({ 
  asChild, 
  children,
  onClick 
}) => {
  return <div onClick={onClick}>{children}</div>
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger }
