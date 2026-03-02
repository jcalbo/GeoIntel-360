import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchRadarHistory } from '../api/client';
import { X, Calendar, Activity, ShieldX, Skull, Building2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RadarHistoryModal({ isOpen, onClose, eventType }) {
    if (!isOpen) return null;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ['radar', eventType, 'history'],
        queryFn: fetchRadarHistory,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.events.length < 20) return undefined;
            return allPages.length * 20;
        },
        enabled: isOpen && !!eventType,
    });

    const getTitle = () => {
        switch (eventType) {
            case 'outage': return 'Historical Internet Outages';
            case 'threat_actor': return 'Historical Threat Campaigns';
            case 'victim': return 'Targeted Victim History';
            default: return 'Event History';
        }
    };

    const getIcon = () => {
        switch (eventType) {
            case 'outage': return <ShieldX className="w-5 h-5 text-red-400" />;
            case 'threat_actor': return <Skull className="w-5 h-5 text-red-500" />;
            case 'victim': return <Building2 className="w-5 h-5 text-orange-500" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    const renderEventContent = (event) => {
        // Parse markdown links if they exist [text](url)
        const renderText = (text) => {
            if (!text) return null;
            const parts = text.split(/\[([^\]]+)\]\(([^)]+)\)/g);
            if (parts.length === 1) return text;

            return parts.map((p, k) => {
                if (k % 3 === 0) return p;
                if (k % 3 === 1) {
                    const url = parts[k + 1];
                    return (
                        <a
                            key={k}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-blue hover:text-blue-400 hover:underline transition-colors"
                        >
                            {p}
                        </a>
                    );
                }
                return null;
            });
        };

        return (
            <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-bg-element border border-border-element hover:border-border-subtle transition-colors">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        {eventType === 'threat_actor' ? (
                            <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(event.title + ' cyber threat actor')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-sm text-text-base hover:text-accent-blue transition-colors flex items-center gap-1 group/link"
                            >
                                {event.title}
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-text-muted" />
                            </a>
                        ) : (
                            <span className="font-bold text-sm text-text-base">{event.title}</span>
                        )}
                    </div>
                    <span className="text-xs text-text-muted font-mono whitespace-nowrap opacity-60">
                        {new Date(event.timestamp).toLocaleString()}
                    </span>
                </div>

                <div className="text-sm text-text-muted">
                    {renderText(event.content)}
                </div>

                {event.metadata && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-bg-surface border border-border-subtle text-text-muted font-mono">
                            {event.metadata}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center pt-16 px-4 pb-4 sm:p-0">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[85vh] flex flex-col pt-safe-top"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-bg-element font-mono">
                                {getIcon()}
                            </div>
                            <h2 className="text-lg font-bold text-text-base">{getTitle()}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-text-muted hover:text-text-base hover:bg-bg-element transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-bg-base/50">
                        {status === 'pending' ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
                                <p className="text-sm text-text-muted">Loading historical data...</p>
                            </div>
                        ) : status === 'error' ? (
                            <div className="text-center py-12 text-red-400">
                                Failed to load historical records.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {data.pages.map((page, i) => (
                                    <React.Fragment key={i}>
                                        {page.events.map((event, j) => (
                                            <div key={event.id || j}>
                                                {renderEventContent(event)}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}

                                {data.pages[0].events.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted border border-dashed border-border-subtle rounded-xl bg-bg-surface/30">
                                        <Calendar className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">No historical events recorded yet.</p>
                                    </div>
                                )}

                                {hasNextPage && (
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="w-full py-3 mt-4 text-sm font-medium text-text-base bg-bg-element hover:bg-bg-element-hover border border-border-element rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isFetchingNextPage ? 'Loading more...' : 'Load Older Events'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
