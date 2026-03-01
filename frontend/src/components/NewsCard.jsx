import React from 'react';
import { ExternalLink, BrainCircuit, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from './Navigation';
import { CATEGORIES } from '../App';

export default function NewsCard({ article, onRequestAnalysis }) {
    const { title, source, date, summary, category, url } = article;

    // Format date relative to now (e.g., "2 hours ago")
    let formattedDate = '';
    try {
        formattedDate = formatDistanceToNow(parseISO(date), { addSuffix: true });
    } catch (e) {
        formattedDate = 'Unknown date';
    }

    // Determine badge color from global categories mapping
    const badgeColor = CATEGORIES.find(c => c.id === category)?.color || 'text-zinc-400';
    const badgeBg = badgeColor.replace('text-', 'bg-').replace('-400', '-500/10').replace('-500', '-500/10'); // Basic opacity transform

    return (
        <div className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm rounded-2xl p-5 md:p-6 flex flex-col h-full hover:border-zinc-700 transition-colors group relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/50">

            {/* Structural Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header info */}
            <div className="flex items-start justify-between mb-4 gap-4">
                <span className={cn("text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border border-current/20", badgeColor)}>
                    {category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                </div>
            </div>

            <h3 className="text-lg md:text-xl font-bold leading-snug mb-3 text-zinc-100 group-hover:text-white transition-colors">
                {title}
            </h3>

            <p className="text-sm text-zinc-400 line-clamp-3 mb-6 flex-1 leading-relaxed">
                {summary || "No abstract available for this intercepted report."}
            </p>

            {/* Footer controls */}
            <div className="flex items-center justify-between pt-4 mt-auto border-t border-zinc-800/50">
                <span className="text-xs font-mono font-medium text-zinc-500 truncate max-w-[140px]" title={source}>
                    {source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </span>

                <div className="flex gap-2">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-400 hover:text-accent-blue bg-zinc-800/30 hover:bg-accent-blue/10 rounded-lg transition-all"
                        title="Open original source"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={onRequestAnalysis}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-purple bg-accent-purple/10 border border-accent-purple/20 hover:bg-accent-purple hover:text-white rounded-lg transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] shadow-none"
                    >
                        <BrainCircuit className="w-4 h-4" />
                        <span className="hidden sm:inline">Deep Analysis</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
