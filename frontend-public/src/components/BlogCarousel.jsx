import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BlogCard from './BlogCard';

const BlogCarousel = ({ blogs }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef(null);
    const total = blogs.length;

    useEffect(() => {
        if (total <= 1) return;
        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % total);
        }, 4000);
        return () => clearInterval(timerRef.current);
    }, [total]);

    const goTo = (index) => {
        setCurrentIndex((index + total) % total);
    };

    const pause = () => clearInterval(timerRef.current);
    const resume = () => {
        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % total);
        }, 4000);
    };

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalBtn = "p-3 md:p-4 bg-yellow-400 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all";

    return (
        <section id="blog" className="px-4 md:px-10 py-24 bg-green-50 border-t-[4px] border-black overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <h2 className="text-4xl md:text-7xl font-black uppercase leading-[0.9]">
                        Blog Posts
                    </h2>
                </div>

                {total > 0 ? (
                    <div
                        className="relative"
                        onMouseEnter={pause}
                        onMouseLeave={resume}
                    >
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                            >
                                {blogs.map((blog) => (
                                    <div key={blog.id || blog.slug} className="w-full flex-shrink-0 px-1 md:px-6">
                                        <div className="max-w-3xl mx-auto">
                                            <BlogCard blog={blog} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {total > 1 && (
                            <>
                                <button
                                    onClick={() => goTo(currentIndex - 1)}
                                    className={`absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-10 ${brutalBtn}`}
                                    aria-label="Previous post"
                                >
                                    <ChevronLeft size={24} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => goTo(currentIndex + 1)}
                                    className={`absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-10 ${brutalBtn}`}
                                    aria-label="Next post"
                                >
                                    <ChevronRight size={24} strokeWidth={3} />
                                </button>

                                <div className="flex justify-center gap-3 mt-10">
                                    {blogs.map((blog, index) => (
                                        <button
                                            key={blog.id || blog.slug}
                                            onClick={() => goTo(index)}
                                            className={`w-4 h-4 rounded-full border-[3px] border-black transition-all ${index === currentIndex ? 'bg-black scale-110' : 'bg-white'}`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 font-bold italic">No blog posts available at the moment.</p>
                    </div>
                )}

            </div>
        </section>
    );
};

export default BlogCarousel;
