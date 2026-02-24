"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within <Sheet>");
  return ctx;
}

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const open = controlledOpen ?? uncontrolled;
  const handleChange = onOpenChange ?? setUncontrolled;

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useSheet();
  return (
    <button className={className} onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  );
}

interface SheetContentProps {
  side?: "right" | "left" | "top" | "bottom";
  className?: string;
  children: React.ReactNode;
}

function SheetContent({ className, children, side = "right" }: SheetContentProps) {
  const { open, onOpenChange } = useSheet();

  const slideVariants = {
    right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
    left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
    top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
    bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
  };

  const positionClasses = {
    right: "inset-y-0 right-0 h-full w-3/4 max-w-sm",
    left: "inset-y-0 left-0 h-full w-3/4 max-w-sm",
    top: "inset-x-0 top-0 w-full",
    bottom: "inset-x-0 bottom-0 w-full",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className={cn("fixed z-50 border bg-background p-6 shadow-lg", positionClasses[side], className)}
            initial={slideVariants[side].initial}
            animate={slideVariants[side].animate}
            exit={slideVariants[side].exit}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {children}
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 mb-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
