import { cn } from "@/lib/utils";
import React from "react";

export function GridBackground({ className }: { className?: string }) {
    return (
        <div className={cn("flex h-full w-full items-center justify-center dark:bg-black", className)}>
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-size-[40px_40px]",
                    "bg-[linear-gradient(to_right,#404040_1px,transparent_1px),linear-gradient(to_bottom,#404040_1px,transparent_1px)]",
                    "dark:bg-[linear-gradient(to_right,#404040_1px,transparent_1px),linear-gradient(to_bottom,#404040_1px,transparent_1px)]",
                )}
            />
            {/* Radial gradient for the container to give a faded look */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black mask-[radial-gradient(ellipse_at_center,transparent_5%,black)] dark:bg-black"></div>
            {/* <p className="relative z-20 bg-linear-to-b from-neutral-200 to-neutral-500 bg-clip-text py-8 text-4xl font-bold text-transparent sm:text-7xl">
                Backgrounds
            </p> */}
        </div>
    );
}
