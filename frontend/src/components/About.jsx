import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, Zap, Activity, Award, Github, Terminal, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api } from '../api/client';
import { Skeleton, SkeletonText } from './Skeleton';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const containerRef = useRef(null);
    const [bio, setBio] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBio = async () => {
            try {
                const data = await api.getBio();
                setBio(data?.data?.bio || {});
            } catch (err) {
                console.error("Failed to fetch bio:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBio();
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".about-box", {
                scrollTrigger: {
                    trigger: "#about",
                    start: "top 75%",
                },
                x: -50,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
    const brutalHover = "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-100";

    return (
        <section id="about" className="px-4 md:px-10 py-24 bg-blue-50 border-y-[4px] border-black" ref={containerRef}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="about-box">
                    <h2 className="text-4xl md:text-6xl font-black mb-12 flex items-center gap-4">
                        <span className="p-3 bg-black text-white rounded-full"><Briefcase size={32} /></span>
                        WHO I AM
                    </h2>
                    <div className={`bg-white p-8 md:p-12 ${brutalBorder} ${brutalShadow}`}>
                        <div className="text-xl md:text-2xl font-bold leading-relaxed mb-6 whitespace-pre-wrap">
                            {loading ? (
                                <SkeletonText lines={5} />
                            ) : bio?.about_intro ? bio.about_intro : (
                                <>
                                    <p className="mb-6">
                                        Computer Engineering student at <span className="underline decoration-yellow-400 decoration-4">ZCOER Pune</span> with a strong interest in building scalable web applications and designing efficient backend systems. I enjoy turning ideas into practical, real-world technology solutions that create meaningful impact.
                                    </p>
                                    <p>
                                        Previously, I completed an AI research internship where I worked on machine learning concepts and deep learning systems, strengthening my analytical thinking and problem-solving skills. I thrive at the intersection of technology, innovation, and leadership, combining technical expertise with teamwork and initiative.
                                    </p>
                                </>
                            )}
                        </div>

                        <Link to="/about" className={`inline-flex items-center gap-2 font-black uppercase text-lg mb-8 hover:underline ${brutalHover}`}>
                            Read Full Bio <ArrowRight size={20} />
                        </Link>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            {loading ? (
                                <>
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-5 rounded-none" />
                                            <Skeleton className="h-5 w-40" />
                                        </div>
                                    ))}
                                </>
                            ) : bio?.highlights && bio.highlights.length > 0 ? (
                                bio.highlights.map((highlight, index) => (
                                    <div key={index} className="flex items-center gap-2 font-black">
                                        <Zap size={18} className={index % 2 === 0 ? "text-yellow-500" : "text-blue-600"} /> {highlight}
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 font-black"><Zap size={18} className="text-yellow-500" /> NEC 2025 Finalist</div>
                                    <div className="flex items-center gap-2 font-black"><Activity size={18} className="text-blue-600" /> Fashion Club President</div>
                                    <div className="flex items-center gap-2 font-black"><Award size={18} className="text-green-600" /> Rising Star @ Bhumi NGO</div>
                                    <div className="flex items-center gap-2 font-black"><Github size={18} /> Hacktoberfest '23</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="hidden lg:flex justify-center">
                    <div className={`w-80 h-80 bg-pink-300 ${brutalBorder} ${brutalShadow} rotate-3 flex items-center justify-center relative overflow-hidden`}>
                        <Terminal size={120} strokeWidth={3} className="opacity-20 absolute -bottom-5 -right-5" />
                        <p className="font-black text-4xl text-center px-6">SCALABLE BACKENDS & INNOVATION</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
