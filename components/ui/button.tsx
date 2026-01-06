import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm hover:shadow-lg hover:shadow-primary-500/30",
                destructive:
                    "bg-red-500 text-white shadow-xs hover:bg-red-600",
                outline:
                    "border border-[var(--ivory-400)] bg-[var(--ivory-50)] text-[var(--ivory-800)] shadow-xs hover:bg-[var(--ivory-200)]",
                secondary:
                    "bg-[var(--ivory-300)] text-[var(--ivory-800)] shadow-xs hover:bg-[var(--ivory-400)]",
                ghost: "text-[var(--ivory-600)] hover:text-[var(--ivory-900)] hover:bg-[var(--ivory-200)]",
                link: "text-primary-600 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-8 rounded-md gap-1.5 px-3 text-xs",
                lg: "h-12 rounded-xl px-6 text-base",
                icon: "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button, buttonVariants }
