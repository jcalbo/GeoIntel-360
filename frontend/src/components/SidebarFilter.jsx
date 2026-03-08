import React from 'react';
import { Calendar, Filter, ArchiveX } from 'lucide-react';

const SOURCES = [
    // Military & Defense
    { id: "https://warontherocks.com/feed/", label: "War on the Rocks" },
    { id: "https://www.longwarjournal.org/feed", label: "The Long War Journal" },
    { id: "https://news.usni.org/feed", label: "USNI News" },

    // Cybersecurity
    { id: "https://feeds.feedburner.com/TheHackersNews", label: "The Hacker News" },
    { id: "https://www.bleepingcomputer.com/feed/", label: "BleepingComputer" },
    { id: "https://www.cisa.gov/cybersecurity-advisories/all.xml", label: "CISA Cyber Alerts" },

    // Economics
    { id: "https://www.cfr.org/rss/all", label: "Council on Foreign Relations" },
    { id: "https://www.bruegel.org/rss.xml", label: "Bruegel" },

    // API Aggregators (These often retain their original reporting source e.g. "Al Jazeera", but we'll include common ones)
    { id: "NewsData.io", label: "NewsData.io Network" },
    { id: "GNews", label: "GNews Network" }
];

function SidebarFilter({
    dateRange,
    setDateRange,
    selectedSources,
    setSelectedSources
}) {
    const handleSourceToggle = (source) => {
        setSelectedSources(prev =>
            prev.includes(source)
                ? prev.filter(s => s !== source)
                : [...prev, source]
        );
    };

    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setSelectedSources([]); // Default to none selected (show all)
    };

    return (
        <div className="w-full h-full bg-bg-surface border-r border-border-subtle p-6 flex flex-col gap-8 overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-text-muted" />
                    Global Filters
                </h2>
                <button
                    onClick={clearFilters}
                    className="p-2 text-text-muted hover:text-text-base hover:bg-bg-element rounded-lg transition-colors"
                    title="Clear all filters"
                >
                    <ArchiveX className="w-4 h-4" />
                </button>
            </div>

            {/* Date Range Picker */}
            <section className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Time Period
                </h3>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-text-muted">From Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full bg-bg-element text-text-base border border-border-element rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-text-muted">To Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full bg-bg-element text-text-base border border-border-element rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                        />
                    </div>
                </div>
            </section>

            {/* Source Toggles */}
            <section className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                    Intelligence Sources
                </h3>
                <div className="flex flex-col gap-2.5">
                    {SOURCES.map(source => {
                        const isSelected = selectedSources.includes(source.id);
                        return (
                            <label
                                key={source.id}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() => handleSourceToggle(source.id)}
                                />
                                <div className={`
                  w-5 h-5 rounded border flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-accent-blue border-accent-blue' : 'bg-bg-element border-border-element group-hover:border-text-muted'}
                `}>
                                    {isSelected && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm select-none transition-colors ${isSelected ? 'text-text-base' : 'text-text-muted'}`}>
                                    {source.label}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </section>

        </div>
    );
}

export { SOURCES };
export default SidebarFilter;
