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

const isAuthEndpoint = (url) =>
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
            isAuthEndpoint(config.url) ||
            config._retried
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

export default authClient;
