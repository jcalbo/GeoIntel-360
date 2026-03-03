import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchNews = async ({ category, queryKey, pageParam = 0, dateRange, selectedSources }) => {
    // TanStack Query passes arguments differently depending on usage;
    // This supports both direct fetching and usage via queryFn.
    const queryCat = category || (queryKey && queryKey[1]);
    const offset = pageParam || 0;

    // Extract dateRange and sources from queryKey if coming from useInfiniteQuery
    let effectiveDateRange = dateRange || (queryKey && queryKey[2]);
    let effectiveSources = selectedSources || (queryKey && queryKey[3]);

    const params = new URLSearchParams({ limit: 20, offset });

    if (queryCat && queryCat !== 'All') {
        params.append('category', queryCat);
    }

    if (effectiveDateRange?.start) params.append('start_date', effectiveDateRange.start);
    if (effectiveDateRange?.end) params.append('end_date', effectiveDateRange.end);

    // FastApi expects multiple `sources=` query params for a list
    if (effectiveSources && effectiveSources.length > 0) {
        effectiveSources.forEach(source => params.append('sources', source));
    }

    const { data } = await apiClient.get(`/news?${params.toString()}`);
    return data;
};

export const searchNews = async (query, dateRange, selectedSources) => {
    const params = new URLSearchParams({ q: query, limit: 20 });

    if (dateRange?.start) params.append('start_date', dateRange.start);
    if (dateRange?.end) params.append('end_date', dateRange.end);

    if (selectedSources && selectedSources.length > 0) {
        selectedSources.forEach(source => params.append('sources', source));
    }

    const { data } = await apiClient.get(`/search?${params.toString()}`);
    return data;
};

export const summarizeText = async (text, articleId) => {
    const { data } = await apiClient.post('/summarize', { text, article_id: articleId });
    return data;
};

export const fetchRadarData = async () => {
    const { data } = await apiClient.get('/radar');
    // Fire and forget persistence request
    apiClient.post('/radar/persist').catch(() => { });
    return data;
};

export const fetchRadarThreats = async () => {
    const { data } = await apiClient.get('/radar/threats');
    // Fire and forget persistence request
    apiClient.post('/radar/threats/persist').catch(() => { });
    return data;
};

export const fetchRadarHistory = async ({ queryKey, pageParam = 0 }) => {
    const eventType = queryKey[1];
    const offset = pageParam || 0;
    const { data } = await apiClient.get(`/radar/history?event_type=${eventType}&limit=20&offset=${offset}`);
    return data;
};
