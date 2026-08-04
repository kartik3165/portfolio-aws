import client from './client';

const api = client;

export const getSkills = async () => {
    const response = await api.get('/public/skill');
    return response.data;
};

export const addSkill = async (skill) => {
    const response = await api.post('/admin/skill/add', { skill });
    return response.data;
};

export const removeSkill = async (skill) => {
    const response = await api.post('/admin/skill/remove', { skill });
    return response.data;
};
