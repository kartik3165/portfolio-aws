import React, { useEffect, useRef } from 'react';
import { Database, Github, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SkeletonProjectCard } from './Skeleton';

gsap.registerPlugin(ScrollTrigger);

const Projects = ({ projects = [], showViewAll = true, loading = false }) => {
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (loading || projects.length === 0) return;

        const ctx = gsap.context(() => {
            gsap.from(".project-header", {
                scrollTrigger: {
                    trigger: "#projects",
                    start: "top 80%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });

            gsap.utils.toArray(".project-card").forEach((card, i) => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top bottom-=50",
                        toggleActions: "play none none reverse"
                    },
                    scale: 0.9,
                    opacity: 0,
                    y: 50,
                    duration: 0.6,
                    ease: "power2.out"
                });
            });
        }, containerRef);
        return () => ctx.revert();
    }, [projects, loading]);

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
    const brutalHover = "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-100";

    return (
        <section id="projects" className="px-4 md:px-10 py-24 bg-orange-50 border-t-[4px] border-black" ref={containerRef}>
            <div className="max-w-[1440px] mx-auto">
                <div className="project-header flex flex-col md:flex-row md:items-end justify-between mb-24 gap-6">
                    <h2 className="text-4xl md:text-7xl font-black uppercase">Projects</h2>
                    <p className="text-xl font-bold max-w-md">Focused on distributed systems, real-time ingestion, and cloud-native backends.</p>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 pb-24 relative">
                    {loading ? (
                        <>
                            <SkeletonProjectCard />
                            <SkeletonProjectCard />
                        </>
                    ) : projects.length > 0 ? (
                        projects.map((project, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(`/project/${project.slug || project.id}`)}
                                className={`project-card sticky lg:static bg-white p-6 md:p-10 ${brutalBorder} ${brutalShadow} ${brutalHover} flex flex-col mb-12 lg:mb-0 cursor-pointer`}
                                style={{
                                    top: `${120 + index * 50}px`,
                                    zIndex: index + 1
                                }}
                            >
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className={`w-16 h-16 md:w-24 md:h-24 flex-shrink-0 ${project.color} ${brutalBorder} flex items-center justify-center overflow-hidden relative`}>
                                        {project.coverImage ? (
                                            <img src={project.coverImage} alt={project.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Database size={40} />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-3xl md:text-5xl font-black mb-4 uppercase">{project.name}</h3>
                                        <p className="text-lg md:text-2xl font-bold mb-8">{project.shortDesc}</p>
                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {project.tech && project.tech.map((t, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-200 text-sm md:text-base font-black border-2 border-black">
                                                    {typeof t === 'string' ? t : t.name}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-6">
                                            <span className="flex items-center gap-2 font-black text-base md:text-lg uppercase hover:underline">
                                                View Details <ArrowRight size={24} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-20">
                            <p className="text-2xl font-black uppercase text-gray-400">No Projects Found.</p>
                        </div>
                    )}
                </div>

                {showViewAll && (
                    <div className="flex justify-center mt-12">
                        <Link
                            to="/project"
                            className={`px-8 py-4 bg-black text-white text-xl font-black uppercase tracking-wider ${brutalBorder} shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:bg-yellow-400 hover:text-black hover:shadow-none hover:translate-y-1 transition-all flex items-center gap-3`}
                        >
                            View All Projects <Github size={24} />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Projects;
