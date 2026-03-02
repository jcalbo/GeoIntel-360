import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNews, searchNews } from '../api/client';
import NewsCard from './NewsCard';
import SkeletonLoader from './SkeletonLoader';
import { AlertTriangle, Database } from 'lucide-react';

export default function NewsFeed({ category, searchQuery, onRequestAnalysis, dateRange, selectedSources }) {
    const isSearch = !!searchQuery;

    // The query function branches based on whether we are searching or listing a category
    const { data, isLoading, isError, error } = useQuery({
        queryKey: isSearch
            ? ['search', searchQuery, dateRange, selectedSources]
            : ['news', category, dateRange, selectedSources],
        queryFn: () => isSearch
            ? searchNews(searchQuery, dateRange, selectedSources)
            : fetchNews({ category, dateRange, selectedSources }),
        staleTime: 5 * 60 * 1000, // 5 minutes fresh
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((key) => (
                    <SkeletonLoader key={key} />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-4 bg-red-950/20 border border-red-900/50 rounded-2xl mx-auto w-full max-w-lg">
                <AlertTriangle className="w-12 h-12 mb-2 opacity-80" />
                <h3 className="text-xl font-bold font-mono">CONNECTION_REFUSED</h3>
                <p className="text-sm font-medium opacity-80 max-w-sm text-center">
                    Intelligence pipeline corrupted. Ensure the API endpoint stands online and CORS policies are established.
                </p>
                <span className="text-xs opacity-50 font-mono mt-2">{error.message}</span>
            </div>
        );
    }

    const articles = data?.articles || [];

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-text-muted gap-6">
                <div className="p-6 bg-bg-surface/50 rounded-full border border-border-subtle">
                    <Database className="w-12 h-12 opacity-50" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-medium text-text-base mb-2">No Intelligence Gathered</h3>
                    <p className="max-w-md text-sm leading-relaxed">
                        The data lake returned an empty subset for {isSearch ? `"${searchQuery}"` : category}. Dispatch backend refresh commands to ingest new feeds.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            {articles.map((article) => (
                <NewsCard
                    key={article.id}
                    article={article}
                    onRequestAnalysis={() => onRequestAnalysis(article)}
                />
            ))}
        </div>
    );
}
