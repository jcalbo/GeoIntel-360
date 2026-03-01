import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchNews = async ({ category, queryKey, pageParam = 0 }) => {
    // TanStack Query passes arguments differently depending on usage;
    // This supports both direct fetching and usage via queryFn.
    const queryCat = category || (queryKey && queryKey[1]);
    const offset = pageParam || 0;

    const params = { limit: 20, offset };
    if (queryCat && queryCat !== 'All') {
        params.category = queryCat;
    }

    const { data } = await apiClient.get('/news', { params });
    return data;
};

export const searchNews = async (query) => {
    const { data } = await apiClient.get('/search', { params: { q: query, limit: 20 } });
    return data;
};

export const summarizeText = async (text, articleId) => {
    const { data } = await apiClient.post('/summarize', { text, article_id: articleId });
    return data;
};
