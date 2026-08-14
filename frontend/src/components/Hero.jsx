import React, { useLayoutEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import gsap from 'gsap';
import { hasText } from '../utils/content';

const Hero = ({ heroImage = 'https://img.reportgenai.in/profile.webp' }) => {
    const containerRef = useRef(null);
    const safeHeroImage = hasText(heroImage) ? heroImage : 'https://img.reportgenai.in/profile.webp';

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            tl.from(".hero-badge", { y: -50, opacity: 0, duration: 0.5, ease: "back.out(1.7)" })
                .from(".hero-title", { x: -100, opacity: 0, duration: 0.8, ease: "power4.out" }, "-=0.2")
                .from(".hero-p", { y: 30, opacity: 0, duration: 0.6 }, "-=0.4")
                .fromTo(".hero-image",
                    { x: 100, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.8, ease: "power2.out", clearProps: "opacity" },
                    "-=0.6")
                .from(".hero-btn", { scale: 0, opacity: 0, stagger: 0.2, duration: 0.5, ease: "back.out(2)" }, "-=0.2");

            // Continuous Floating Animation
            gsap.to(".hero-image img", {
                y: -15,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: 1.5
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const scrollToProjects = () => {
        const element = document.getElementById('projects');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadowSmall = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    const brutalHover = "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-100";
    const brutalBtn = `bg-yellow-400 px-6 py-3 font-black uppercase text-sm md:text-base tracking-wider ${brutalBorder} ${brutalShadowSmall} ${brutalHover}`;

    return (
        <section id="home" className="min-h-[85vh] flex items-end md:items-center px-4 md:px-10 pt-20 pb-10 md:pb-20 relative overflow-hidden" ref={containerRef}>
            <div className="max-w-7xl mx-auto w-full relative z-10">
                <div className="max-w-3xl relative z-10">
                    <span className={`hero-badge inline-block mb-4 px-3 py-1 bg-green-400 font-bold uppercase text-xs md:text-sm ${brutalBorder}`}>
                        Top 5 Finalist @ NEC IIT Bombay
                    </span>
                    <h1 className="hero-title text-6xl md:text-9xl font-black leading-none mb-6 text-transparent bg-clip-text bg-black stroke-black fill-black" style={{ WebkitTextStroke: '2px black' }}>
                        KARTIK NAGARE.
                    </h1>
                    <p className="hero-p text-xl md:text-3xl font-bold mb-10 max-w-xl leading-tight bg-white/80 backdrop-blur-sm p-4 border-2 border-black inline-block">
                        Backend Specialist | <span className="bg-yellow-300 px-1">FastAPI & Django</span> Enthusiast | Building Scalable Cloud Systems.
                    </p>
                    <div className="flex flex-wrap gap-4 md:gap-6">
                        <button onClick={scrollToProjects} className={`hero-btn ${brutalBtn}`}>
                            Explore Projects
                        </button>
                        <button className={`hero-btn ${brutalBtn} bg-white flex items-center gap-2`}>
                            Resume <Download size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Image - Absolute Bottom Right */}
            <div className="hero-image absolute bottom-40 md:bottom-0 right-0 z-0 w-[90vw] md:w-[60vw] lg:w-[45vw] h-[60vh] md:h-[85vh] pointer-events-none hidden md:flex items-end justify-end">
                <img
                    src={safeHeroImage}
                    alt="Kartik Nagare"
                    className="w-full h-full object-contain object-bottom drop-shadow-2xl opacity-90"
                />
            </div>
        </section>
    );
};

export default Hero;
