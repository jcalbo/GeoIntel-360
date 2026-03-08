import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShieldAlert, Globe, TrendingUp, Search, Wifi } from 'lucide-react';
import Navigation from './components/Navigation';
import NewsFeed from './components/NewsFeed';
import SearchBar from './components/SearchBar';
import AnalysisModal from './components/AnalysisModal';
import RadarDashboard from './components/RadarDashboard';

const queryClient = new QueryClient();

export const CATEGORIES = [
  { id: 'Geopolitics', icon: Globe, color: 'text-accent-blue' },
  { id: 'Cybersecurity', icon: ShieldAlert, color: 'text-accent-purple' },
  { id: 'Economics', icon: TrendingUp, color: 'text-accent-emerald' },
  { id: 'Internet Radar', icon: Wifi, color: 'text-[#f38020]' },
];

function App() {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisArticle, setAnalysisArticle] = useState(null);
  const [analysisContext, setAnalysisContext] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) setActiveTab('Search Results');
    else setActiveTab(CATEGORIES[0].id);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-bg-base text-text-base flex flex-col font-sans transition-colors duration-300">

        {/* Top App Bar */}
        <header className="sticky top-0 z-40 bg-bg-surface/80 backdrop-blur-md border-b border-border-subtle shadow-sm transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bg-element to-bg-surface border border-border-element flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-text-base" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">GeoIntel-360</h1>
            </div>

            <div className="flex-1 max-w-2xl flex items-center gap-4">
              <SearchBar onSearch={handleSearch} />

              {/* Theme Switcher */}
              <div className="hidden md:flex items-center p-1 bg-bg-element rounded-lg border border-border-element">
                <button onClick={() => setTheme('dark')} className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${theme === 'dark' ? 'bg-bg-element-hover text-text-base shadow-sm' : 'text-text-muted hover:text-text-base'}`}>Dark</button>
                <button onClick={() => setTheme('light')} className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${theme === 'light' ? 'bg-bg-element-hover text-text-base shadow-sm' : 'text-text-muted hover:text-text-base'}`}>Daylight</button>
                <button onClick={() => setTheme('grey')} className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${theme === 'grey' ? 'bg-bg-element-hover text-text-base shadow-sm' : 'text-text-muted hover:text-text-base'}`}>Grey</button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">

          {/* Navigation Tabs and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {!searchQuery && (
              <Navigation
                categories={CATEGORIES}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}

            {/* Refresh News Button — hidden on Radar tab (has its own refresh) */}
            {activeTab !== 'Internet Radar' && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('http://localhost:8000/api/news/refresh', {
                      method: 'POST',
                    });
                    if (res.ok) {
                      alert("News refresh triggered in the background!");
                    }
                  } catch (error) {
                    console.error("Failed to refresh news:", error);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-bg-element hover:bg-bg-element-hover text-text-base rounded-lg text-sm font-medium transition-colors border border-border-element hover:border-border-subtle shadow-sm"
                title="Fetch latest OSINT data from sources"
              >
                <Globe className="w-4 h-4" />
                <span>Refresh News</span>
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-text-muted" />
              <h2 className="text-xl font-semibold">Search Results for "{searchQuery}"</h2>
              <button
                onClick={() => handleSearch('')}
                className="ml-auto text-sm text-text-muted hover:text-text-base transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Feed Content */}
          {activeTab === 'Internet Radar' ? (
            <RadarDashboard />
          ) : (
            <NewsFeed
              category={activeTab}
              searchQuery={searchQuery}
              onRequestAnalysis={(article, context) => {
                setAnalysisArticle(article);
                setAnalysisContext(context);
              }}
            />
          )}

        </main>
      </div>

      {/* Analysis Modal Portal */}
      <AnalysisModal
        article={analysisArticle}
        contextArticles={analysisContext}
        onClose={() => {
          setAnalysisArticle(null);
          setAnalysisContext([]);
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
