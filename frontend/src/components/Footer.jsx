import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="py-12 border-t-[4px] border-black text-center bg-white relative z-10">
            <Link
                to="/admin/login"
                className="inline-block font-black text-xl md:text-2xl uppercase tracking-widest hover:text-amber-600 transition-colors"
            >
                Kartik Nagare
            </Link>
            <p className="mt-4 text-sm font-bold text-gray-500 italic">
                Problem-Solving • Leadership • Innovation
            </p>
        </footer>
    );
};

export default Footer;
