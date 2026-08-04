import React, { useRef } from 'react';
import { Mail, Github, Linkedin } from 'lucide-react';

const RedditIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`lucide lucide-reddit ${className}`}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M17 13c0 1.7-2.2 3-5 3s-5-1.3-5-3" />
        <line x1="17.5" x2="17.51" y1="9" y2="9" />
        <line x1="6.5" x2="6.51" y1="9" y2="9" />
    </svg>
);

const Contact = () => {
    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
    const brutalShadowSmall = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    const brutalHover = "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-100";
    const brutalBtn = `bg-yellow-400 px-6 py-3 font-black uppercase text-sm md:text-base tracking-wider ${brutalBorder} ${brutalShadowSmall} ${brutalHover}`;

    return (
        <section id="contact" className="px-4 md:px-10 py-24 flex flex-col items-center">
            <div className={`max-w-6xl mx-auto w-full bg-yellow-400 p-8 md:p-16 text-center ${brutalBorder} ${brutalShadow} relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-2 bg-black opacity-10"></div>
                <h2 className="text-4xl md:text-8xl font-black mb-8 uppercase tracking-tighter italic">Get In Touch</h2>
                <p className="text-xl md:text-3xl font-bold mb-12">
                    Building the future of compute. Let's collaborate.
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                    <a href="mailto:Kartiknagare3165@gmail.com" className={`${brutalBtn} bg-white flex items-center gap-2`}>
                        <Mail size={20} /> Email Kartik
                    </a>
                    <div className="flex gap-4">
                        <a href="https://github.com/kartiknagare" target="_blank" rel="noopener noreferrer" className={`p-4 bg-black text-white ${brutalBorder} ${brutalShadowSmall} ${brutalHover}`}>
                            <Github size={28} />
                        </a>
                        <a href="https://linkedin.com/in/kartiknagare" target="_blank" rel="noopener noreferrer" className={`p-4 bg-blue-600 text-white ${brutalBorder} ${brutalShadowSmall} ${brutalHover}`}>
                            <Linkedin size={28} />
                        </a>
                        <a href="https://reddit.com/user/kartiknagare" target="_blank" rel="noopener noreferrer" className={`p-4 bg-orange-600 text-white ${brutalBorder} ${brutalShadowSmall} ${brutalHover}`}>
                            <RedditIcon size={28} />
                        </a>
                    </div>
                </div>
                <p className="mt-12 font-black text-lg underline">Pune, India</p>
            </div>
        </section>
    );
};

export default Contact;
