import React, { useState, useEffect } from 'react';
import { Calendar, Filter, ArchiveX } from 'lucide-react';
import { subDays, subWeeks, subMonths, format } from 'date-fns';
import { SOURCES } from '../constants';

function SidebarFilter({
    dateRange,
    setDateRange,
    selectedSources,
    setSelectedSources
}) {
    const [timePeriod, setTimePeriod] = useState('always');

    // Sync dropdown with cleared external state
    useEffect(() => {
        if (!dateRange.start && !dateRange.end) {
            setTimePeriod('always');
        }
    }, [dateRange]);

    const handleSourceToggle = (sourceId) => {
        if (selectedSources.length === 0) {
            // Starting from "All" state, isolate to the clicked source
            setSelectedSources([sourceId]);
        } else {
            // Normal toggle behavior
            setSelectedSources(prev =>
                prev.includes(sourceId)
                    ? prev.filter(s => s !== sourceId)
                    : [...prev, sourceId]
            );
        }
    };

    const handleTimePeriodChange = (e) => {
        const period = e.target.value;
        setTimePeriod(period);

        const today = new Date();
        const end = format(today, 'yyyy-MM-dd');
        let start = '';

        if (period === 'last24h') {
            start = format(subDays(today, 1), 'yyyy-MM-dd');
        } else if (period === 'last3days') {
            start = format(subDays(today, 3), 'yyyy-MM-dd');
        } else if (period === '1week') {
            start = format(subWeeks(today, 1), 'yyyy-MM-dd');
        } else if (period === '1month') {
            start = format(subMonths(today, 1), 'yyyy-MM-dd');
        } else if (period === 'always') {
            start = '';
            // For "always", we clear the dates so it fetches everything
            setDateRange({ start: '', end: '' });
            return;
        }

        setDateRange({ start, end });
    };

    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setTimePeriod('always');
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

            {/* Date Range Picker -> Time Period Dropdown */}
            <section className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Time Period
                </h3>
                <div className="flex flex-col gap-3">
                    <select
                        value={timePeriod}
                        onChange={handleTimePeriodChange}
                        className="w-full bg-bg-element text-text-base border border-border-element rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue appearance-none cursor-pointer"
                    >
                        <option value="always">Always</option>
                        <option value="last24h">Last 24h</option>
                        <option value="last3days">Last 3 days</option>
                        <option value="1week">1 week ago</option>
                        <option value="1month">1 month ago</option>
                    </select>
                </div>
            </section>

            {/* Source Toggles */}
            <section className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                    Intelligence Sources
                </h3>
                <div className="flex flex-col gap-2.5">
                    {SOURCES.map(source => {
                        const isSelected = selectedSources.length === 0 || selectedSources.includes(source.id);
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
                  w-5 h-5 rounded border flex items-center justify-center transition-colors pointer-events-none
                  ${isSelected ? 'bg-accent-blue border-accent-blue' : 'bg-bg-surface border-border-strong group-hover:border-accent-blue'}
                `}>
                                    {isSelected && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm select-none transition-colors pointer-events-none ${isSelected ? 'text-text-base' : 'text-text-muted group-hover:text-text-base'}`}>
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

export default SidebarFilter;
