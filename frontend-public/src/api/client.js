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

export const api = {
    getBlogs: async () => (await publicClient.get('/public/blog')).data,
    getBlogBySlug: async (slug) => (await publicClient.get(`/public/blog/${slug}`)).data,
    getProjects: async () => (await publicClient.get('/public/projects')).data,
    getProjectBySlug: async (slug) => (await publicClient.get(`/public/projects/${slug}`)).data,
    getComments: async (blogId) => (await publicClient.get(`/public/comment/${blogId}`)).data,
    createComment: async (blogId, data) => (await publicClient.post(`/public/comment/${blogId}`, data)).data,
    getSkills: async () => (await publicClient.get('/public/skill')).data,
    getExperience: async () => (await publicClient.get('/public/experience')).data,
    getResearchPapers: async () => (await publicClient.get('/public/research_papers')).data,
    getAchievements: async () => (await publicClient.get('/public/achievements')).data,
    getBio: async () => (await publicClient.get('/public/bio')).data,
};

export default authClient;
