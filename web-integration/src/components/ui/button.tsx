import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:from-red-700 hover:via-red-800 hover:to-red-900 hover:-translate-y-0.5",
        outline:
          "border-2 border-gray-300 bg-white text-gray-700 shadow-md hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg hover:-translate-y-0.5",
        secondary:
          "bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-800 shadow-md hover:from-gray-200 hover:via-gray-300 hover:to-gray-200 hover:shadow-lg hover:-translate-y-0.5",
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-800",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };