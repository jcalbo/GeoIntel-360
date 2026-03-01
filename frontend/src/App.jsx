import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShieldAlert, Globe, TrendingUp, Search } from 'lucide-react';
import Navigation from './components/Navigation';
import NewsFeed from './components/NewsFeed';
import SearchBar from './components/SearchBar';
import AnalysisModal from './components/AnalysisModal';

const queryClient = new QueryClient();

export const CATEGORIES = [
  { id: 'Geopolitics', icon: Globe, color: 'text-accent-blue' },
  { id: 'Cybersecurity', icon: ShieldAlert, color: 'text-accent-purple' },
  { id: 'Economics', icon: TrendingUp, color: 'text-accent-emerald' },
];

function App() {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisArticle, setAnalysisArticle] = useState(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) setActiveTab('Search Results');
    else setActiveTab(CATEGORIES[0].id);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">

        {/* Top App Bar */}
        <header className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-zinc-100" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">GeoIntel-360</h1>
            </div>

            <div className="flex-1 max-w-2xl">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">

          {/* Navigation Tabs */}
          {!searchQuery && (
            <Navigation
              categories={CATEGORIES}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}

          {searchQuery && (
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-zinc-400" />
              <h2 className="text-xl font-semibold">Search Results for "{searchQuery}"</h2>
              <button
                onClick={() => handleSearch('')}
                className="ml-auto text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Feed Content */}
          <NewsFeed
            category={activeTab}
            searchQuery={searchQuery}
            onRequestAnalysis={setAnalysisArticle}
          />

        </main>
      </div>

      {/* Analysis Modal Portal */}
      <AnalysisModal
        article={analysisArticle}
        onClose={() => setAnalysisArticle(null)}
      />
    </QueryClientProvider>
  );
}

export default App;
