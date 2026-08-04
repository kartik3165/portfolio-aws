import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Github, ExternalLink, Code2, Layers, FileText, ArrowRight, Server, Database, Cpu, Brain, Zap, Monitor, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api } from '../api/client';
import MarkdownRenderer from '../components/MarkdownRenderer';
import useScrollTracking from "../hooks/useScrollTracking";
import { Skeleton, SkeletonText } from '../components/Skeleton';

gsap.registerPlugin(ScrollTrigger);

const ProjectDetailPage = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useScrollTracking();

    const containerRef = useRef(null);
    const heroImageRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProject = async () => {
            setLoading(true);
            try {
                const data = await api.getProjectBySlug(id);
                setProject(data);
                if (window.gtag) {
                    window.gtag("event", "project_view", {
                        project_slug: id,
                        project_name: data.name
                    });
                }
            } catch (err) {
                console.error("Failed to fetch project:", err);
                setError("Project not found or failed to load.");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (project && !loading) {
            const ctx = gsap.context(() => {
                const tl = gsap.timeline();

                // Hero Animations
                tl.from(".project-title", {
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power4.out"
                })
                    .from(".project-subtitle", {
                        y: 20,
                        opacity: 0,
                        duration: 0.6,
                        ease: "power2.out"
                    }, "-=0.4")
                    .from(".project-stats", {
                        y: 20,
                        opacity: 0,
                        duration: 0.6,
                        stagger: 0.1
                    }, "-=0.4")
                    .from(heroImageRef.current, {
                        scale: 0.95,
                        opacity: 0,
                        duration: 1,
                        ease: "power2.out"
                    }, "-=0.6");

                // Scroll Animations for sections
                gsap.utils.toArray('.reveal-section').forEach(section => {
                    gsap.from(section, {
                        y: 50,
                        opacity: 0,
                        duration: 0.8,
                        scrollTrigger: {
                            trigger: section,
                            start: "top 80%",
                            toggleActions: "play none none reverse"
                        }
                    });
                });

            }, containerRef);
            return () => ctx.revert();
        }
    }, [project, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400">
                <Navbar />
                <main className="pt-32 pb-24 px-4 md:px-10 max-w-7xl mx-auto" aria-hidden="true">
                    <Skeleton className="h-5 w-40 mb-8" />
                    <div className="flex flex-col gap-6 mb-12">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-16 w-full md:w-3/4" />
                        <Skeleton className="h-8 w-full md:w-1/2" />
                        <div className="flex gap-3">
                            <Skeleton className="h-12 w-32 border-[3px] border-black rounded-none" />
                            <Skeleton className="h-12 w-32 border-[3px] border-black rounded-none" />
                        </div>
                    </div>
                    <Skeleton className="h-96 w-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-16 rounded-none" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                        <div className="lg:col-span-8 flex flex-col gap-8">
                            <SkeletonText lines={5} />
                            <SkeletonText lines={4} />
                        </div>
                        <div className="lg:col-span-4">
                            <div className="bg-yellow-50 p-6 md:p-8 border-[3px] border-black flex flex-col gap-4">
                                <Skeleton className="h-7 w-40" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-5 w-5/6" />
                                <Skeleton className="h-5 w-2/3" />
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
                <h1 className="text-4xl font-black mb-4">Project Not Found</h1>
                <Link to="/" className="text-xl font-bold underline">Back Home</Link>
            </div>
        );
    }

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
    const brutalBtn = `px-6 py-3 font-black uppercase text-sm md:text-base tracking-wider ${brutalBorder} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all`;


    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400 overflow-x-hidden" ref={containerRef}>
            <Navbar />

            <main className="pt-32 pb-24 px-4 md:px-10 max-w-7xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 font-black mb-8 hover:underline uppercase text-sm tracking-widest">
                    <ArrowLeft size={20} /> Back to Projects
                </Link>

                {/* --- Hero Section --- */}
                <header className="mb-24">
                    <div className="flex flex-col gap-6 mb-12">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-3 mb-2">
                            <span className={`px-4 py-1 ${project.color} font-bold uppercase text-xs md:text-sm ${brutalBorder}`}>
                                {project.tech[0]?.name || "Project"}
                            </span>
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                            <h1 className="project-title text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] mb-6">
                                {project.name}
                            </h1>
                            <p className="project-subtitle text-xl md:text-2xl font-medium text-gray-600 max-w-4xl leading-relaxed">
                                {project.subtitle}
                            </p>
                        </div>

                        {/* Highlights / Stats */}
                        {project.stats && (
                            <div className="project-stats flex flex-wrap gap-6 md:gap-12 mt-4 pt-6 border-t-2 border-dashed border-gray-300">
                                {project.stats.map((stat, i) => (
                                    <div key={i}>
                                        <p className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">{stat.label}</p>
                                        <p className="text-2xl md:text-3xl font-black">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CTAs */}
                        <div className="project-stats flex gap-4 flex-wrap mt-6">
                            {project.live && (
                                <a
                                    href={project.live}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                        if (window.gtag) {
                                            window.gtag("event", "project_live_click", {
                                                project_slug: id,
                                                project_name: project.name
                                            });
                                        }
                                    }}
                                    className={`${brutalBtn} bg-green-400 flex items-center gap-2`}
                                >
                                    Live Demo <ExternalLink size={18} />
                                </a>
                            )}

                            {project.github && (
                                <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                        if (window.gtag) {
                                            window.gtag("event", "project_github_click", {
                                                project_slug: id,
                                                project_name: project.name
                                            });
                                        }
                                    }}
                                    className={`${brutalBtn} bg-white flex items-center gap-2`}
                                >
                                    GitHub <Github size={18} />
                                </a>
                            )}

                            {project.document && (
                                <a
                                    href={project.document}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                        if (window.gtag) {
                                            window.gtag("event", "project_docs_click", {
                                                project_slug: id,
                                                project_name: project.name
                                            });
                                        }
                                    }}
                                    className={`${brutalBtn} bg-blue-200 flex items-center gap-2`}
                                >
                                    Docs <FileText size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Hero Image - Larger & Impactful */}
                    <div ref={heroImageRef} className={`w-full h-auto bg-gray-100 ${brutalBorder} ${brutalShadow} overflow-hidden relative cursor-pointer group`} onClick={() => setSelectedImage(project.coverImage || (project.screenshots && project.screenshots[0]))}>
                        <div className="flex items-center justify-center bg-gray-50">
                            {project.coverImage || (project.screenshots && project.screenshots[0]) ? (
                                <img
                                    src={project.coverImage || project.screenshots[0]}
                                    alt={`${project.name} preview`}
                                    className="w-full h-auto object-contain"
                                />
                            ) : (
                                <div className="text-gray-400 font-black text-2xl uppercase py-24">No Preview Available</div>
                            )}
                        </div>
                    </div>
                </header>

                {/* --- Case Study Content --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* Left Column: Main Narrative */}
                    <div className="lg:col-span-8 flex flex-col gap-20">
                        {/* Markdown Description */}
                        {project.fullDesc && (
                            <div className="reveal-section mb-8">
                                <MarkdownRenderer content={project.fullDesc} />
                            </div>
                        )}

                        {/* Problem / Solution / Outcome Blocks */}
                        <section className="reveal-section flex flex-col gap-12">
                            {project.problem && (
                                <div>
                                    <h2 className="text-sm font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-8 h-[2px] bg-black"></span> The Problem
                                    </h2>
                                    <p className="text-xl md:text-2xl font-medium leading-relaxed text-gray-900">
                                        {project.problem}
                                    </p>
                                </div>
                            )}

                            {project.solution && (
                                <div>
                                    <h2 className="text-sm font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-8 h-[2px] bg-black"></span> The Solution
                                    </h2>
                                    <p className="text-lg md:text-xl leading-relaxed text-gray-800">
                                        {project.solution}
                                    </p>
                                </div>
                            )}

                            {project.outcome && (
                                <div className={`bg-gray-50 p-6 md:p-8 ${brutalBorder}`}>
                                    <h2 className="text-sm font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-8 h-[2px] bg-black"></span> The Outcome
                                    </h2>
                                    <p className="text-lg md:text-xl font-bold leading-relaxed text-black">
                                        {project.outcome}
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Architecture Diagram */}
                        {(project.architecture || project.architectureImage) && (
                            <section className="reveal-section">
                                <h3 className="text-3xl font-black uppercase mb-8 flex items-center gap-3">
                                    <Layers size={32} /> System Architecture
                                </h3>

                                {project.architectureImage ? (
                                    <div
                                        className={`bg-white p-4 md:p-8 ${brutalBorder} ${brutalShadow} cursor-pointer hover:scale-[1.01] transition-transform`}
                                        onClick={() => setSelectedImage(project.architectureImage)}
                                    >
                                        <img
                                            src={project.architectureImage}
                                            alt="System Architecture"
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className={`bg-white p-8 md:p-12 ${brutalBorder} flex flex-wrap items-center justify-center gap-4 md:gap-8`}>
                                        {/* Simple Flow Visualization */}
                                        {project.architecture.map((node, i) => (
                                            <React.Fragment key={i}>
                                                <div className="flex flex-col items-center gap-2 group">
                                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 border-2 border-black flex items-center justify-center text-center p-2 rounded-lg group-hover:-translate-y-1 transition-transform">
                                                        <span className="font-bold text-sm md:text-base">{node}</span>
                                                    </div>
                                                </div>
                                                {i < project.architecture.length - 1 && (
                                                    <ArrowRight className="text-gray-400 rotate-90 md:rotate-0" size={24} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Challenges & Learnings */}
                        <section className="reveal-section grid grid-cols-1 md:grid-cols-2 gap-8">
                            {project.challenges && (
                                <div>
                                    <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                                        <Zap className="text-red-500" /> Challenges
                                    </h3>
                                    <ul className="space-y-4">
                                        {project.challenges.map((item, i) => (
                                            <li key={i} className="flex gap-4">
                                                <span className="font-black text-gray-300">0{i + 1}</span>
                                                <p className="font-medium text-gray-800">{item}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {project.learnings && (
                                <div>
                                    <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                                        <Brain className="text-blue-500" /> Learnings
                                    </h3>
                                    <ul className="space-y-4">
                                        {project.learnings.map((item, i) => (
                                            <li key={i} className="flex gap-4">
                                                <span className="font-black text-gray-300">0{i + 1}</span>
                                                <p className="font-medium text-gray-800">{item}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {/* Screenshots Grid */}
                        {project.screenshots && project.screenshots.length > 0 && (
                            <section className="reveal-section">
                                <h3 className="text-3xl font-black uppercase mb-8 flex items-center gap-3">
                                    <Monitor size={32} /> Interface
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {project.screenshots.map((src, i) => (
                                        <div
                                            key={i}
                                            className={`bg-gray-100 aspect-video ${brutalBorder} overflow-hidden group hover:shadow-lg transition-all cursor-pointer`}
                                            onClick={() => setSelectedImage(src)}
                                        >
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold relative">
                                                <img src={src} alt="Screenshot" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Right Column: Sidebar */}
                    <aside className="lg:col-span-4 space-y-12">

                        {/* Tech Stack Card */}
                        <div className={`bg-yellow-50 p-6 md:p-8 ${brutalBorder} sticky top-32 reveal-section`}>
                            <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                                <Code2 /> Tech Stack
                            </h3>
                            <div className="space-y-4">
                                {project.tech.map((t, i) => {
                                    // Handle both old (string) and new (object) formats for backward compatibility
                                    const name = typeof t === 'string' ? t : t.name;
                                    const purpose = typeof t === 'string' ? null : t.purpose;

                                    return (
                                        <div key={i} className="group">
                                            <div className="flex items-center justify-between font-bold mb-1">
                                                <span>{name}</span>
                                            </div>
                                            {purpose && (
                                                <p className="text-xs text-gray-500 font-mono uppercase tracking-tight">{purpose}</p>
                                            )}
                                            <div className="h-[1px] w-full bg-black/10 mt-3 group-last:hidden" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Future Improvements */}
                        {project.future && (
                            <div className={`p-6 md:p-8 border-2 border-dashed border-gray-300 reveal-section`}>
                                <h3 className="text-lg font-black uppercase mb-4 text-gray-500">Future Roadmap</h3>
                                <ul className="space-y-3">
                                    {project.future.map((item, i) => (
                                        <li key={i} className="flex gap-2 text-sm font-bold text-gray-700">
                                            <span className="text-green-500">➜</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </aside>
                </div>

            </main>

            <Footer />

            {/* Full Screen Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8 cursor-pointer backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 text-white hover:text-yellow-400 transition-colors bg-black/50 p-2 rounded-full pointer-events-auto"
                    >
                        <X size={32} strokeWidth={3} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full Screen View"
                        className="max-w-full max-h-[90vh] object-contain border-4 border-white shadow-2xl pointer-events-none"
                    />
                </div>
            )}
        </div>
    );
};

export default ProjectDetailPage;
