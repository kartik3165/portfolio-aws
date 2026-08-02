const API_URL = import.meta.env.PROD
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000';

// Helper to make API calls
const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'omit', // No credentials for public site
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const api = {
    // Blogs
    getBlogs: () => apiCall('/public/blog'),
    getBlogBySlug: (slug) => apiCall(`/public/blog/${slug}`),

    // Projects
    getProjects: () => apiCall('/public/projects'),
    getProjectBySlug: (slug) => apiCall(`/public/projects/${slug}`),
    createProject: (data) => apiCall('/admin/projects', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateProject: (slug, data) => apiCall(`/admin/projects/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // Comments
    getComments: (blogId) => apiCall(`/public/comment/${blogId}`),
    createComment: (blogId, data) => apiCall(`/public/comment/${blogId}`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // Skills
    getSkills: () => apiCall('/public/skill'),

    // About Page Data
    getExperience: () => apiCall('/public/experience'),
    getResearchPapers: () => apiCall('/public/research_papers'),
    getAchievements: () => apiCall('/public/achievements'),
    getBio: () => apiCall('/public/bio'),
};