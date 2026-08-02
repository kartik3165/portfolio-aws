
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleNavigation = (id) => {
        setIsMenuOpen(false);

        if (id === 'about') {
            navigate('/about');
            return;
        }

        if (id === 'projects') {
            navigate('/project');
            return;
        }

        if (id === 'blog') {
            navigate('/blog');
            return;
        }

        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: id } });
        } else {
            scrollToSection(id);
        }
    };

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Handle scroll after navigation
    React.useEffect(() => {
        if (location.pathname === '/' && location.state?.scrollTo) {
            setTimeout(() => {
                scrollToSection(location.state.scrollTo);
                // Clear state to prevent scrolling on refresh
                window.history.replaceState({}, document.title);
            }, 100);
        }
    }, [location]);

    const navLinks = ['home', 'about', 'skills', 'projects', 'blog', 'contact'];

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#fafafa] border-b-[4px] border-black h-16 md:h-20 flex items-center px-4 md:px-10 justify-between">
            <div
                className="font-black text-2xl md:text-3xl tracking-tighter cursor-pointer"
                onClick={() => handleNavigation('home')}
            >
                KARTIK.
            </div>

            <div className="hidden md:flex gap-8">
                {navLinks.map(id => (
                    <button
                        key={id}
                        onClick={() => handleNavigation(id)}
                        className="font-bold uppercase text-sm hover:underline underline-offset-4"
                    >
                        {id}
                    </button>
                ))}
            </div>

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={32} strokeWidth={3} /> : <Menu size={32} strokeWidth={3} />}
            </button>

            {isMenuOpen && (
                <div className="fixed inset-0 top-16 bg-white z-40 flex flex-col items-center justify-center gap-8 md:hidden">
                    {navLinks.map(id => (
                        <button
                            key={id}
                            onClick={() => handleNavigation(id)}
                            className="font-black text-4xl uppercase"
                        >
                            {id}
                        </button>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
