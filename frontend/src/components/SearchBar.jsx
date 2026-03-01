import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const clearSearch = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="relative flex items-center w-full max-w-md ml-auto group"
        >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-muted group-focus-within:text-accent-blue transition-colors" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search intelligence database..."
                className="block w-full pl-10 pr-10 py-2 border border-border-element rounded-xl leading-5 bg-bg-surface/50 text-text-base placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue focus:bg-bg-surface transition-all sm:text-sm"
            />
            {query && (
                <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-base"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </form>
    );
}
