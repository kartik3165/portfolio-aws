import client, { publicClient } from './client';

const handleResponse = (response) => response.data;

export const getProjects = async () => {
    try {
        const response = await publicClient.get('/public/projects');
        return handleResponse(response);
    } catch (e) {
        console.warn("Fetch projects failed", e);
        return [];
    }
};

export const getAdminProjects = async () => {
    try {
        const response = await client.get('/admin/projects');
        return handleResponse(response);
    } catch (e) {
        console.warn("Fetch admin projects failed", e);
        return [];
    }
};

export const getProjectBySlug = async (slug) => {
    try {
        const response = await publicClient.get(`/public/projects/${slug}`);
        return handleResponse(response);
    } catch (e) {
        console.warn(`Fetch project ${slug} failed`, e);
        return null;
    }
};

export const addProject = async (data) => {
        const response = await client.post('/admin/projects', data);
    return handleResponse(response);
};

export const updateProject = async (id, data) => {
        const response = await client.put(`/admin/projects/${id}`, data);
    return handleResponse(response);
};

export const deleteProject = async (id) => {
    const response = await client.delete(`/admin/projects/${id}`);
    return handleResponse(response);
};
