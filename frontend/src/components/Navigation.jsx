import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Navigation({ categories, activeTab, setActiveTab }) {
    return (
        <div className="flex flex-wrap gap-2 md:gap-4 p-2 bg-bg-surface/50 rounded-2xl w-fit border border-border-subtle/50 transition-colors duration-300">
            {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;

                return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={cn(
                            "relative px-4 py-3 md:px-6 md:py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors",
                            isActive ? "text-text-base" : "text-text-muted hover:text-text-base hover:bg-bg-element/50"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute inset-0 bg-bg-element rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", isActive ? cat.color : "text-current")} />
                            {cat.id}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
