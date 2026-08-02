import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Projects from '../components/Projects';
import { api } from '../api/client';
import { Loader2 } from 'lucide-react';

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await api.getProjects();
            setProjects(data || []); // Ensure array
        } catch (err) {
            console.error("Failed to fetch projects:", err);
            setError("Failed to load projects. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400 overflow-x-hidden">
            <Navbar />

            <main className="pt-20">
                {/* 
                  Passing showViewAll={false} to hide the recursive button.
                  Passing isPage={true} to maybe modify header styling if needed.
                */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 size={48} className="animate-spin text-black" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 pb-40">
                        <h2 className="text-2xl font-black uppercase text-red-500">{error}</h2>
                    </div>
                ) : (
                    <Projects projects={projects} showViewAll={false} />
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ProjectsPage;
