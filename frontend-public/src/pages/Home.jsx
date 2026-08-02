import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Hero from '../components/Hero';
import About from '../components/About';
import Skills from '../components/Skills';
import Projects from '../components/Projects';
import Contact from '../components/Contact';
import { api } from '../api/client';

const Home = () => {
    const containerRef = useRef(null);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.getProjects();
                setProjects(data || []);
            } catch (err) {
                console.error("Failed to load projects:", err);
            }
        };

        fetchProjects();

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

    return (
        <main className="pt-20" ref={containerRef}>
            <Hero />
            <About />
            <Skills />
            <Projects projects={projects.slice(0, 2)} />
            <Contact />

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
