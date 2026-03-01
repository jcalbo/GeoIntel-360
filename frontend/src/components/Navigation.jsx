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
        <div className="flex flex-wrap gap-2 md:gap-4 p-2 bg-zinc-900/50 rounded-2xl w-fit border border-zinc-800/50">
            {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;

                return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={cn(
                            "relative px-4 py-3 md:px-6 md:py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors",
                            isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute inset-0 bg-zinc-800 rounded-xl"
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
