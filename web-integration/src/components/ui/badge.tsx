import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:from-blue-600 hover:to-blue-700",
        secondary:
          "border-transparent bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-gray-500/20 hover:shadow-md hover:from-gray-200 hover:to-gray-300",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700",
        outline: "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };