import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Projects from '../components/Projects';
import { api } from '../api/client';
import { SkeletonProjectCard } from '../components/Skeleton';

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

            <main>
                {/* 
                  Passing showViewAll={false} to hide the recursive button.
                  Passing isPage={true} to maybe modify header styling if needed.
                */}
                {loading ? (
                    <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 pb-24 pt-8">
                        <SkeletonProjectCard />
                        <SkeletonProjectCard />
                        <SkeletonProjectCard />
                        <SkeletonProjectCard />
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
