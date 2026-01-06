"use client"

import React, { CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    shimmerColor?: string
    borderRadius?: string
    shimmerDuration?: string
    background?: string
    className?: string
    children?: React.ReactNode
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
    (
        {
            shimmerColor = "#ffffff",
            shimmerDuration = "3s",
            borderRadius = "12px",
            background = "linear-gradient(135deg, #c98a52 0%, #b87344 100%)",
            className,
            children,
            ...props
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "relative z-0 flex h-10 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap px-6 py-2 font-medium text-white transition-all disabled:pointer-events-none disabled:opacity-50",
                    "hover:shadow-lg hover:shadow-primary-500/30 hover:scale-[1.02]",
                    "active:scale-[0.98]",
                    "transform-gpu",
                    className,
                )}
                style={{
                    background,
                    borderRadius,
                } as CSSProperties}
                {...props}
            >
                {/* Shimmer overlay */}
                <span
                    className="absolute inset-0 z-10 overflow-hidden rounded-[inherit]"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${shimmerColor}40, transparent)`,
                        animation: `shimmer ${shimmerDuration} ease-in-out infinite`,
                    } as CSSProperties}
                />

                {/* content */}
                <span className="relative z-20">{children}</span>

                <style jsx>{`
                    @keyframes shimmer {
                        0% {
                            transform: translateX(-100%);
                        }
                        100% {
                            transform: translateX(100%);
                        }
                    }
                `}</style>
            </button>
        )
    },
)

ShimmerButton.displayName = "ShimmerButton"

export { ShimmerButton }
