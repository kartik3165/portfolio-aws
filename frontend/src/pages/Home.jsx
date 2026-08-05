import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const Hero = lazy(() => import('../components/Hero'));
const About = lazy(() => import('../components/About'));
const Skills = lazy(() => import('../components/Skills'));
const Projects = lazy(() => import('../components/Projects'));
const Contact = lazy(() => import('../components/Contact'));
const BlogCarousel = lazy(() => import('../components/BlogCarousel'));

const SectionFallback = ({ label, minHeight = 'min-h-[40vh]' }) => (
    <section className={`${minHeight} flex items-center justify-center px-4`}>
        <div className="border-[3px] border-black bg-white px-5 py-3 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Loading {label}
        </div>
    </section>
);

const Home = () => {
    const containerRef = useRef(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const res = await api.getHomeData();
                setData(res?.data || {});
            } catch (err) {
                console.error("Failed to load home data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();

        const ctx = gsap.context(() => {
            // Floating Stickers Animation
            gsap.to(".sticker", {
                y: "random(-15, 15)",
                x: "random(-10, 10)",
                rotation: "random(-5, 5)",
                duration: "random(2, 4)",
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadowSmall = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";

    const projects = data?.projects || [];
    const blogs = data?.blogs || [];

    return (
        <main className="pt-20" ref={containerRef}>
            <Suspense fallback={<SectionFallback label="hero" minHeight="min-h-[70vh]" />}>
                <Hero heroImage={data?.bio?.hero_image} />
            </Suspense>
            <Suspense fallback={<SectionFallback label="about" />}>
                <About bio={data?.bio} />
            </Suspense>
            <Suspense fallback={<SectionFallback label="skills" />}>
                <Skills skills={data?.skills || []} />
            </Suspense>
            <Suspense fallback={<SectionFallback label="projects" />}>
                <Projects projects={projects.slice(0, 2)} loading={loading} />
            </Suspense>
            <Suspense fallback={<SectionFallback label="blogs" />}>
                <BlogCarousel blogs={blogs.slice(0, 3)} loading={loading} />
            </Suspense>
            {blogs.length > 0 && (
                <div className="px-4 md:px-10 -mt-10 mb-24 flex justify-center">
                    <Link
                        to="/blog"
                        className={`px-8 py-4 bg-black text-white text-xl font-black uppercase tracking-wider ${brutalBorder} shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:bg-yellow-400 hover:text-black hover:shadow-none hover:translate-y-1 transition-all flex items-center gap-3`}
                    >
                        See All Blogs <ArrowRight size={24} />
                    </Link>
                </div>
            )}
            <Suspense fallback={<SectionFallback label="contact" minHeight="min-h-[30vh]" />}>
                <Contact />
            </Suspense>

            {/* GSAP Animated Stickers */}
            <div className="fixed bottom-10 left-10 hidden xl:block z-50 pointer-events-none">
                <div className={`sticker bg-pink-400 px-6 py-3 rotate-[-12deg] ${brutalBorder} ${brutalShadowSmall} font-black uppercase text-md`}>
                    FastAPI & Redis ⚡
                </div>
            </div>
            <div className="fixed top-32 right-10 hidden xl:block z-50 pointer-events-none">
                <div className={`sticker bg-cyan-400 px-6 py-3 rotate-[8deg] ${brutalBorder} ${brutalShadowSmall} font-black uppercase text-md`}>
                    NEC IITB 🏆
                </div>
            </div>
            <div className="fixed top-1/2 left-5 hidden xl:block z-50 pointer-events-none">
                <div className={`sticker bg-green-400 px-4 py-2 rotate-[-5deg] ${brutalBorder} ${brutalShadowSmall} font-black uppercase text-sm`}>
                    Dockerized 🐳
                </div>
            </div>
        </main>
    );
};

export default Home;
