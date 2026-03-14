import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ShieldAlert, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fetchDossier = async (actorName) => {
    const res = await fetch(`http://localhost:8000/api/radar/threats/${encodeURIComponent(actorName)}/details`);
    if (!res.ok) throw new Error("Failed to fetch dossier");
    return res.json();
};

export default function McpDossierModal({ actorName, isOpen, onClose }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['dossier', actorName],
        queryFn: () => fetchDossier(actorName),
        enabled: !!actorName && isOpen,
        staleTime: 10 * 60 * 1000,
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-bg-base/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                    >
                        <div className="bg-bg-surface w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border-subtle shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-element/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Threat Actor Dossier</h2>
                                        <p className="text-sm text-text-muted font-mono">{actorName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-text-muted hover:text-text-base hover:bg-bg-element rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-text-muted">
                                        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
                                        <p className="text-sm font-mono animate-pulse">Querying VirusTotal MCP for Intel...</p>
                                    </div>
                                ) : isError ? (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                                        Failed to generate dossier. Check if VirusTotal generic MCP client is running.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                         <div className="flex items-center gap-2 text-text-muted border-b border-border-subtle pb-2">
                                             <FileText className="w-4 h-4" />
                                             <span className="text-xs uppercase font-bold tracking-wider">AI Synopses & MCP Enrichment</span>
                                         </div>
                                        <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed text-text-base">
                                            {/* Render basic markdown roughly by splitting paragraphs and bolding */}
                                            {data?.dossier?.split('\n').map((para, i) => {
                                                if (!para.trim()) return <br key={i}/>;
                                                const segments = para.split('**');
                                                return (
                                                    <p key={i} className="mb-2">
                                                        {segments.map((seg, j) => 
                                                            j % 2 === 1 ? <strong key={j} className="text-white font-bold">{seg}</strong> : seg
                                                        )}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
