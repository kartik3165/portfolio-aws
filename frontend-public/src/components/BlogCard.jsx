import React, { useState } from 'react';
import { ArrowRight, Calendar, User, Share2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogCard = ({ blog }) => {
    const [copied, setCopied] = useState(false);
    const brutalBorder = "border-[3px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    const brutalHover = "group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200";

    const handleShare = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent Link navigation

        const url = `${window.location.origin}/blog/${blog.slug}`;

        // Try to use the native Web Share API (mobile/supported browsers)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: blog.title,
                    text: blog.excerpt,
                    url: url
                });
            } catch (err) {
                // User cancelled or share failed, fallback to clipboard if needed
                // But usually if share fails we don't auto-copy, just log
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback for desktop/unsupported browsers
            navigator.clipboard.writeText(url)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(err => {
                    console.error('Failed to copy options: ', err);
                });
        }
    };

    return (
        <Link to={`/blog/${blog.slug}`} className="group block h-full">
            <div className={`bg-white h-full flex flex-col ${brutalBorder} ${brutalShadow} ${brutalHover}`}>
                {/* Image Container */}
                <div className="h-48 overflow-hidden border-b-[3px] border-black bg-gray-200 relative">
                    {blog.image ? (
                        <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-yellow-400 font-black text-2xl uppercase opacity-50">
                            Blog Post
                        </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={handleShare}
                            className="bg-white p-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all z-10"
                            title="Share post"
                        >
                            {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
                        </button>
                        <div className="bg-white px-3 py-1 font-bold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center">
                            {blog.tags[0]}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                            <Calendar size={14} /> {blog.date}
                        </span>
                    </div>

                    <h3 className="text-2xl font-black uppercase mb-3 leading-[1.1] group-hover:text-amber-600 transition-colors">
                        {blog.title}
                    </h3>

                    <p className="text-gray-600 font-medium mb-6 line-clamp-3 flex-grow">
                        {blog.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-black/10 mt-auto">
                        <span className="flex items-center gap-2 text-sm font-bold">
                            <User size={16} /> {blog.author}
                        </span>
                        <span className="flex items-center gap-1 font-black uppercase text-sm group-hover:translate-x-1 transition-transform">
                            Read Post <ArrowRight size={16} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BlogCard;
