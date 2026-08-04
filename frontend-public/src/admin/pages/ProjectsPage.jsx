import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/ProjectForm';
import { getAdminProjects, deleteProject, getProjectBySlug } from '../../api/projects';

const ProjectsPage = () => {
    const [view, setView] = useState('list');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // Admin endpoint includes drafts; auth comes from session cookies
            const data = await getAdminProjects();
            setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = () => {
        setSelectedProject(null);
        setView('form');
    };

    const handleEdit = async (project) => {
        setLoading(true);
        try {
            const fullProject = await getProjectBySlug(project.slug);
            if (fullProject) {
                setSelectedProject(fullProject);
                setView('form');
            } else {
                alert("Failed to fetch project details");
            }
        } catch (error) {
            console.error("Error fetching project details:", error);
            alert("Error fetching project details");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        setView('list');
        fetchProjects();
    };

    const handleCancel = () => {
        setView('list');
        setSelectedProject(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            await deleteProject(id);
            fetchProjects();
        } catch (error) {
            console.error(error);
            alert("Failed to delete project.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
                    <div className="flex gap-4">
                        {view === 'list' && (
                            <button onClick={handleCreate} className="neo-button-primary">
                                + Add Project
                            </button>
                        )}
                        <Link to="/admin" className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">
                            &larr; Dashboard
                        </Link>
                    </div>
                </div>

                {view === 'list' ? (
                    loading ? (
                        <div className="text-center py-12 text-gray-500">Loading projects...</div>
                    ) : (
                        <ProjectList projects={projects} onEdit={handleEdit} onDelete={handleDelete} />
                    )
                ) : (
                    <ProjectForm project={selectedProject} onSave={handleSave} onCancel={handleCancel} />
                )}
            </div>
        </div>
    );
};

export default ProjectsPage;
