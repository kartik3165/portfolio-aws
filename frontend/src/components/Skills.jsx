import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ToggleLeft, ToggleRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_SKILLS = [
    'Python', 'FastAPI', 'Django', 'REST APIs', 'AWS', 'Docker',
    'DynamoDB', 'Redis', 'PostgreSQL', 'React', 'Git', 'CI/CD'
];

const Skills = ({ skills = [] }) => {
    const containerRef = useRef(null);
    const [zeroGravity, setZeroGravity] = useState(false);
    const visibleSkills = skills.length > 0 ? skills : DEFAULT_SKILLS;

    // Initial Entrance Animation
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".skill-box", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                },
                scale: 0.5,
                opacity: 0,
                y: 20,
                stagger: 0.05,
                duration: 0.4,
                ease: "back.out(1.7)"
            });
        }, containerRef);
        return () => ctx.revert();
    }, [skills]);

    // Zero Gravity Animation Effect
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (zeroGravity) {
                gsap.utils.toArray(".skill-box").forEach(box => {
                    gsap.to(box, {
                        x: "random(-100, 100)",
                        y: "random(-100, 100)",
                        rotation: "random(-20, 20)",
                        duration: "random(2, 4)",
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut",
                        overwrite: "auto"
                    });
                });
            } else {
                gsap.to(".skill-box", {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    duration: 0.5,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            }
        }, containerRef);
        return () => ctx.revert();
    }, [zeroGravity, skills]);

    const onSkillEnter = (e) => {
        gsap.to(e.currentTarget, {
            scale: 1.1,
            y: -8,
            rotation: Math.random() * 6 - 3,
            duration: 0.3,
            ease: "back.out(3)",
            overwrite: true
        });
    };

    const onSkillLeave = (e) => {
        if (zeroGravity) {
            // Return to chaotic floating state
            gsap.to(e.currentTarget, {
                scale: 1,
                x: "random(-50, 50)",
                y: "random(-50, 50)",
                rotation: "random(-20, 20)",
                duration: "random(2, 4)",
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: 0.1
            });
        } else {
            // Return to grid state
            gsap.to(e.currentTarget, {
                scale: 1,
                x: 0,
                y: 0,
                rotation: 0,
                duration: 0.3,
                ease: "power2.out",
                overwrite: true
            });
        }
    };

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadowSmall = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";

    return (
        <section id="skills" className="px-4 md:px-10 py-24" ref={containerRef}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <h2 className="text-4xl md:text-6xl font-black uppercase">Toolbox</h2>

                    <button
                        onClick={() => setZeroGravity(!zeroGravity)}
                        className={`flex items-center gap-3 px-4 py-2 bg-white ${brutalBorder} ${brutalShadowSmall} active:translate-y-1 active:shadow-none transition-all disabled:opacity-50`}
                    >
                        <span className="font-bold uppercase text-sm md:text-base">Zero Gravity</span>
                        {zeroGravity ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-400" />}
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 md:gap-6 relative z-10 p-6">
                    {visibleSkills.map((skill, index) => (
                        <div
                            key={index}
                            onMouseEnter={onSkillEnter}
                            onMouseLeave={onSkillLeave}
                            className={`skill-box px-6 py-4 bg-white font-black text-lg md:text-2xl ${brutalBorder} ${brutalShadowSmall} hover:bg-yellow-300 transition-colors cursor-pointer select-none`}
                        >
                            {skill}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Skills;
