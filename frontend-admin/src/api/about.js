import client, { publicClient } from './client';

const api = client;

const handleResponse = (response) => response.data;

export const getExperiences = async () => {
    try {
        const response = await publicClient.get('/public/experience');
        return response.data.experience || [];
    } catch (e) {
        console.warn("Fetch experience failed, trying alternate or returning empty", e);
        return [];
    }
};

export const addExperience = async (data) => {
        const response = await api.post('/admin/experience', data);
    return handleResponse(response);
};

export const updateExperience = async (id, data) => {
        const response = await api.put(`/admin/experience/${id}`, data);
    return handleResponse(response);
};

export const deleteExperience = async (id) => {
    const response = await api.delete(`/admin/experience/${id}`);
    return handleResponse(response);
};

export const getResearchPapers = async () => {
    try {
        const response = await publicClient.get('/public/research_papers');
        return response.data.research_papers || [];
    } catch (e) {
        console.warn("Fetch papers failed", e);
        return [];
    }
};

export const addResearchPaper = async (data) => {
    const response = await api.post('/admin/research_papers', data);
    return handleResponse(response);
};

export const updateResearchPaper = async (id, data) => {
    const response = await api.put(`/admin/research_papers/${id}`, data);
    return handleResponse(response);
};

export const deleteResearchPaper = async (id) => {
    const response = await api.delete(`/admin/research_papers/${id}`);
    return handleResponse(response);
};

export const getAchievements = async () => {
    try {
        const response = await publicClient.get('/public/achievements');
        return response.data.achievements || [];
    } catch (e) {
        console.warn("Fetch achievements failed", e);
        return [];
    }
};

export const addAchievement = async (data) => {
    const response = await api.post('/admin/achievements', data);
    return handleResponse(response);
};

export const updateAchievement = async (id, data) => {
    const response = await api.put(`/admin/achievements/${id}`, data);
    return handleResponse(response);
};

export const deleteAchievement = async (id) => {
    const response = await api.delete(`/admin/achievements/${id}`);
    return handleResponse(response);
};

export const getBio = async () => {
    try {
        const response = await publicClient.get('/public/bio');
        const data = response.data;
        console.log("getBio response:", data); // Debug log

        // 1. { data: { bio: { ... } } }
        if (data?.data?.bio) return data.data.bio;

        // 2. { bio: { ... } }
        if (data?.bio) return data.bio;

        // 3. { data: { summary: ... } } (Bio object directly in data)
        if (data?.data && (data.data.summary !== undefined || data.data.about_intro !== undefined)) {
            return data.data;
        }

        // 4. { summary: ... } (Bio object directly in root)
        if (data?.summary !== undefined || data?.about_intro !== undefined) {
            return data;
        }

        return {};
    } catch (e) {
        console.warn("Fetch bio failed", e);
        return {};
    }
};

export const updateBio = async (data) => {
    const response = await api.put('/admin/bio', data);
    return handleResponse(response);
};
