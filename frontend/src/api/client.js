import axios from 'axios';

const API_URL = import.meta.env.PROD
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000';

export const publicClient = axios.create({
    baseURL: API_URL,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshPromise = null;

const isAuthEndpoint = (url = '') =>
    url.includes('/admin/login') ||
    url.includes('/admin/refresh') ||
    url.includes('/admin/logout') ||
    url === '/admin/auth';

authClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response, config } = error;
        if (
            !response ||
            response.status !== 401 ||
            isAuthEndpoint(config?.url) ||
            config?._retried
        ) {
            return Promise.reject(error);
        }

        config._retried = true;
        try {
            refreshPromise = refreshPromise || authClient.post('/admin/refresh');
            await refreshPromise;
        } catch {
            return Promise.reject(error);
        } finally {
            refreshPromise = null;
        }

        return authClient(config);
    }
);

const CACHE_TTL_MS = 60_000;
const getCache = new Map();

const cachedGet = (url, ttl = CACHE_TTL_MS) => {
    const now = Date.now();
    const hit = getCache.get(url);

    if (hit && hit.expiresAt > now) return Promise.resolve(hit.data);
    if (hit && hit.promise) return hit.promise;

    const promise = publicClient
        .get(url)
        .then(({ data }) => {
            getCache.set(url, { data, promise: null, expiresAt: Date.now() + ttl });
            return data;
        })
        .catch((err) => {
            getCache.delete(url);
            throw err;
        });

    getCache.set(url, { data: null, promise, expiresAt: 0 });
    return promise;
};

export const api = {
    getHomeData: () => cachedGet('/public/home', 5 * 60_000),
    getBlogs: () => cachedGet('/public/blog'),
    getBlogBySlug: (slug) => cachedGet(`/public/blog/${slug}`),
    getProjects: () => cachedGet('/public/projects'),
    getProjectBySlug: (slug) => cachedGet(`/public/projects/${slug}`),
    getComments: (blogId) => cachedGet(`/public/comment/${blogId}`),
    createComment: async (blogId, data) => (await publicClient.post(`/public/comment/${blogId}`, data)).data,
    getSkills: () => cachedGet('/public/skill'),
    getExperience: () => cachedGet('/public/experience'),
    getResearchPapers: () => cachedGet('/public/research_papers'),
    getAchievements: () => cachedGet('/public/achievements'),
    getBio: () => cachedGet('/public/bio'),
};

export default authClient;
