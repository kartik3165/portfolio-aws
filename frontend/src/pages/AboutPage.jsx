import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, GraduationCap, Award, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../api/client';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import { hasText, hasItems } from '../utils/content';

const AboutPage = () => {
    const containerRef = useRef(null);
    const [experience, setExperience] = useState([]);
    const [papers, setPapers] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [bio, setBio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bioData, expData, papersData, achData] = await Promise.all([
                    api.getBio(),
                    api.getExperience(),
                    api.getResearchPapers(),
                    api.getAchievements()
                ]);

                setBio(bioData?.data?.bio || {});
                setExperience(expData.experience || []);
                setPapers(papersData.research_papers || []);
                setAchievements(achData.achievements || []);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
                setError("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!loading && !error) {
            const ctx = gsap.context(() => {
                gsap.from(".about-header h1, .about-header p", { y: -50, opacity: 0, duration: 0.8, ease: "power4.out" });
                gsap.from(".about-image", { scale: 0.8, x: 50, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.4");
                gsap.from(".content-section", {
                    y: 50,
                    opacity: 0,
                    stagger: 0.2,
                    duration: 0.8,
                    ease: "power2.out",
                    delay: 0.3
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [loading, error]);

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400 overflow-x-hidden" ref={containerRef}>
            <Navbar />

            <main className="pt-32 pb-24 px-4 md:px-10 max-w-7xl mx-auto">

                <div className="about-header mb-16 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                    <div className="md:col-span-2">
                        <h1 className="text-5xl md:text-8xl font-black uppercase mb-8 leading-none">
                            About <br /><span className="text-blue-600">Kartik Nagare.</span>
                        </h1>
                        <p className="text-xl md:text-3xl font-bold max-w-3xl leading-relaxed">
                            {hasText(bio?.summary) ? bio.summary : "A backend-focused engineer passionate about distributed systems, cloud architecture, and building reliable solutions that scale. I enjoy solving complex problems with simple, efficient designs and creating technology that makes a real-world impact."}
                        </p>
                    </div>
                    <div className="about-image flex justify-center md:justify-end">
                        <div className="w-72 h-72 md:w-96 md:h-96 relative">
                            <img
                                src={hasText(bio?.about_image) ? bio.about_image : "https://img.reportgenai.in/blog/019c0ac5-99a8-79b1-810e-7e64cda93483.webp"}
                                alt="Kartik Nagare"
                                className="w-full h-full object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-16" aria-hidden="true">
                        <div className="bg-white p-8 md:p-12 border-[3px] md:border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Skeleton className="h-8 w-40 mb-8" />
                            <SkeletonText lines={6} />
                        </div>
                        <div>
                            <Skeleton className="h-9 w-52 mb-8" />
                            <div className="relative border-l-[4px] border-black ml-4 md:ml-8 space-y-12 pl-8 md:pl-12">
                                <div className="bg-white p-8 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                                    <Skeleton className="h-7 w-2/3" />
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                                <div className="bg-white p-8 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                                    <Skeleton className="h-7 w-1/2" />
                                    <Skeleton className="h-5 w-36" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Skeleton className="h-9 w-56 mb-8" />
                            <div className="space-y-6">
                                <div className="bg-white p-8 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                                    <Skeleton className="h-6 w-1/2" />
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                                <div className="bg-white p-8 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="h-4 w-44" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Skeleton className="h-9 w-48 mb-8" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Skeleton className="h-36 p-6 border-[3px] border-black rounded-none" />
                                <Skeleton className="h-36 p-6 border-[3px] border-black rounded-none" />
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-black uppercase text-red-500">{error}</h2>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Bio Section */}
                        <div className={`content-section bg-white p-8 md:p-12 ${brutalBorder} ${brutalShadow}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="p-3 bg-yellow-400 border-2 border-black rounded-full"><BookOpen size={24} /></span>
                                <h2 className="text-3xl font-black uppercase">My Story</h2>
                            </div>
                            <div className="text-lg md:text-xl font-medium leading-relaxed whitespace-pre-wrap">
                                {hasText(bio?.story) ? bio.story : (
                                    <>
                                        <p className="mb-6">
                                            I am currently a Computer Engineering student at <span className="font-black bg-yellow-200 px-1">ZCOER Pune</span>. My journey started with simple Python scripts and evolved into architecting complex serverless backends and real-time IoT systems.
                                        </p>
                                        <p>
                                            I follow a mindset I call <span className="font-black">Brutalist Engineering</span> keeping systems simple, robust, and effective rather than overcomplicated. In the past, I completed an AI research internship where I explored machine learning theory and deep learning concepts, which strengthened my analytical thinking and system design approach.Beyond coding, I enjoy leading communities, organizing events, and taking initiative in activities that combine leadership with technology.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="content-section">
                            <h2 className="text-3xl font-black uppercase mb-8 flex items-center gap-3">
                                <GraduationCap size={32} /> Education
                            </h2>
                            <div className={`bg-white p-8 ${brutalBorder} ${brutalShadow} mb-6`}>
                                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                    <h3 className="text-2xl font-black">Bachelor of Engineering (Computer)</h3>
                                    <span className="font-bold bg-gray-200 px-3 py-1 border-2 border-black text-sm">2022 - 2026</span>
                                </div>
                                <p className="text-lg font-bold text-gray-600 mb-2">Zeal College of Engineering & Research, Pune</p>
                                <p className="font-medium">CGPA: 7.8/10 (Current)</p>
                            </div>

                            <div className={`bg-white p-8 ${brutalBorder} ${brutalShadow} mb-6`}>
                                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                    <h3 className="text-2xl font-black">HSC (Science)</h3>
                                    <span className="font-bold bg-gray-200 px-3 py-1 border-2 border-black text-sm">2020 - 2022</span>
                                </div>
                                <p className="text-lg font-bold text-gray-600 mb-2"> M.T.S.DIGHOLE SEC VID. NAYGAON </p>
                                <p className="font-medium">Percentage: 77.4%</p>
                            </div>

                            <div className={`bg-white p-8 ${brutalBorder} ${brutalShadow} mb-6`}>
                                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                    <h3 className="text-2xl font-black">SSC (English)</h3>
                                    <span className="font-bold bg-gray-200 px-3 py-1 border-2 border-black text-sm">2019 - 2020</span>
                                </div>
                                <p className="text-lg font-bold text-gray-600 mb-2">S.M.P.D Navjeevan Day School</p>
                                <p className="font-medium">Percentage: 85.4%</p>
                            </div>
                        </div>

                        {/* Experience Timeline */}
                        <div className="content-section">
                            <h2 className="text-3xl font-black uppercase mb-12 flex items-center gap-3">
                                <Briefcase size={32} /> Experience
                            </h2>

                            <div className="relative border-l-[4px] border-black ml-4 md:ml-8 space-y-12 pl-8 md:pl-12">
                                {experience.length > 0 ? experience.map((exp, index) => (
                                    <div key={exp.id || index} className="relative">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[46px] md:-left-[62px] top-2 w-6 h-6 md:w-8 md:h-8 ${index === 0 ? 'bg-black border-yellow-400' : 'bg-white border-black'} rounded-full border-[4px]`}></div>

                                        <div className={`bg-white p-8 ${brutalBorder} ${brutalShadow}`}>
                                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                                <h3 className="text-2xl font-black uppercase">{exp.role}</h3>
                                                <span className={`font-bold ${index === 0 ? 'bg-blue-200' : 'bg-gray-200'} px-3 py-1 border-2 border-black text-sm uppercase`}>{exp.period}</span>
                                            </div>
                                            <p className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
                                                {exp.company} <span className="text-sm font-medium text-gray-400">• {exp.location}</span>
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2 font-medium text-gray-800">
                                                {Array.isArray(exp.description) && exp.description.filter(hasText).map((desc, i) => (
                                                    <li key={i}>{desc}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 font-bold italic">No experience entries found.</p>
                                )}
                            </div>
                        </div>

                        {/* Research Papers */}
                        <div className="content-section">
                            <h2 className="text-3xl font-black uppercase mb-8 flex items-center gap-3">
                                <BookOpen size={32} /> Research Papers
                            </h2>
                            <div className="space-y-6">
                                {papers.length > 0 ? papers.map((paper, index) => (
                                    <div key={paper.id || index} className={`bg-white p-8 ${brutalBorder} ${brutalShadow} group hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-black uppercase mb-2 group-hover:text-blue-600 transition-colors">
                                                    {paper.title}
                                                </h3>
                                                <p className="font-bold text-gray-500 text-sm mb-4">{paper.publication}</p>
                                                <p className="font-medium leading-relaxed">
                                                    {paper.description}
                                                </p>
                                            </div>
                                            {hasText(paper.link) && (
                                                <a href={paper.link} target="_blank" rel="noopener noreferrer">
                                                    <ArrowRight className="flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-blue-600" size={32} />
                                                </a>
                                            )}
                                        </div>
                                        {hasItems(paper.tags) && (
                                            <div className="flex gap-2 mt-6">
                                                {paper.tags.filter(hasText).map((tag, i) => (
                                                    <span key={i} className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-black uppercase">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-gray-500 font-bold italic">No research papers found.</p>
                                )}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="content-section">
                            <h2 className="text-3xl font-black uppercase mb-8 flex items-center gap-3">
                                <Award size={32} /> Achievements
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {achievements.length > 0 ? achievements.map((ach, index) => (
                                    <div key={ach.id || index} className={`p-6 ${brutalBorder} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${index % 2 === 0 ? 'bg-green-100' : 'bg-pink-100'}`}>
                                        <h3 className="text-xl font-black mb-2">{ach.title}</h3>
                                        <p className="font-medium">{ach.description}</p>
                                    </div>
                                )) : (
                                    <p className="col-span-2 text-gray-500 font-bold italic">No achievements found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default AboutPage;
