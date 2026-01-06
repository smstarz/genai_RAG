import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "flex h-12 w-full rounded-xl border border-[var(--ivory-400)] bg-[var(--ivory-50)] px-5 py-3 text-base text-[var(--ivory-900)] placeholder:text-[var(--ivory-500)] transition-all outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium shadow-sm",
                className
            )}
            {...props}
        />
    )
}

export { Input }
