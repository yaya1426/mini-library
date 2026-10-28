import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const pressableClasses =
  "border-3 border-black shadow-sm motion-safe:transition-[translate,box-shadow,background-color,color] motion-safe:duration-100 ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-1 active:translate-y-1 active:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:active:translate-x-0 disabled:active:translate-y-0";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-bold ltr:uppercase ltr:tracking-wide select-none cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:shadow-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: cn(
          pressableClasses,
          "bg-black text-white hover:bg-gray-800 active:bg-gray-900",
        ),
        secondary: cn(
          pressableClasses,
          "bg-white text-black hover:bg-gray-100 active:bg-gray-200",
        ),
        destructive: cn(
          pressableClasses,
          "bg-black text-white hover:bg-gray-800 active:bg-gray-900",
        ),
        ghost:
          "border-3 border-transparent bg-transparent text-black shadow-none hover:bg-gray-100 hover:border-black active:bg-gray-200 disabled:border-transparent",
        link: "border-0 bg-transparent text-black underline underline-offset-4 decoration-2 shadow-none hover:bg-gray-100 px-1",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-12 px-5 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
