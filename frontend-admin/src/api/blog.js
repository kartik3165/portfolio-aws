import client, { publicClient } from './client';

// Helper to handle responses
const handleResponse = (response) => response.data;

export const getBlogs = async () => {
    try {
        const response = await publicClient.get('/public/blog');
        return handleResponse(response);
    } catch (e) {
        console.warn("Fetch blogs failed", e);
        return [];
    }
};

export const getAdminBlogs = async () => {
    try {
        const response = await client.get('/admin/blog');
        return handleResponse(response);
    } catch (e) {
        console.warn("Fetch admin blogs failed", e);
        return [];
    }
};

export const getBlogBySlug = async (slug) => {
    try {
        const response = await publicClient.get(`/public/blog/${slug}`);
        return handleResponse(response);
    } catch (e) {
        console.warn(`Fetch blog ${slug} failed`, e);
        return null;
    }
}

export const addBlog = async (data) => {
        const response = await client.post('/admin/blog', data);
    return handleResponse(response);
};

export const updateBlog = async (id, data) => {
        const response = await client.put(`/admin/blog/${id}`, data);
    return handleResponse(response);
};

export const deleteBlog = async (id) => {
    const response = await client.delete(`/admin/blog/${id}`);
    return handleResponse(response);
};

export const getComments = async (blogId) => {
    try {
        const response = await publicClient.get(`/public/comment/${blogId}`);
        return response.data;
    } catch (e) {
        console.warn("Fetch comments failed", e);
        return [];
    }
};

export const deleteComment = async (blogId, commentId) => {
    const response = await client.delete(`/admin/comment/${blogId}/${commentId}`);
    return handleResponse(response);
};
