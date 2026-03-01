import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BrainCircuit, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { summarizeText } from '../api/client';

export default function AnalysisModal({ article, onClose }) {
    if (!article) return null;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['summary', article.id],
        queryFn: () => summarizeText(article.summary || article.title, article.id),
        staleTime: 1000 * 60 * 60, // 1 hour cache
        enabled: !!article,
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 isolate">

                {/* Backdrop overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="relative w-full max-w-2xl bg-bg-base border border-border-subtle rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-300"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 md:p-6 border-b border-border-subtle bg-bg-surface/30">
                        <div className="flex gap-3 items-center pr-8">
                            <div className="p-2 bg-accent-purple/10 text-accent-purple rounded-xl border border-accent-purple/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold leading-tight">AI Executive Summary</h3>
                                <p className="text-xs text-text-muted font-mono mt-0.5">TARGET_ID: {article.id.substring(0, 8).toUpperCase()}</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2 text-text-muted hover:text-text-base bg-bg-surface hover:bg-bg-element rounded-lg transition-colors border border-transparent hover:border-border-element"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 overflow-y-auto">
                        <h4 className="text-base font-semibold mb-6 flex gap-2 items-center text-text-base">
                            <div className="w-1 h-4 bg-border-element rounded-full" />
                            {article.title}
                        </h4>

                        {isLoading ? (
                            <div className="py-8 flex flex-col items-center justify-center gap-4 text-text-muted mt-4 rounded-xl border border-border-subtle bg-bg-surface/10">
                                <Activity className="w-8 h-8 animate-pulse text-accent-purple/50" />
                                <span className="text-sm font-mono tracking-widest animate-pulse">GENERATING_ANALYSIS...</span>
                            </div>
                        ) : isError ? (
                            <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
                                Failed to execute neural summarization. Disconnected from AI cluster.
                            </div>
                        ) : (
                            <div className="prose prose-p:text-sm prose-li:text-sm max-w-none prose-li:marker:text-accent-purple/70">
                                <div
                                    className="space-y-4 whitespace-pre-wrap leading-relaxed text-text-base"
                                >
                                    {data?.summary}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Decorator */}
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-accent-purple/50 to-transparent opacity-50" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
