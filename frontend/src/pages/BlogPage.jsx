import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BlogCard from '../components/BlogCard';
import { api } from '../api/client';
import { SkeletonBlogCard } from '../components/Skeleton';
import { BookOpen } from 'lucide-react';

const BlogPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const data = await api.getBlogs();
            setBlogs(data);
        } catch (err) {
            console.error("Failed to fetch blogs:", err);
            setError("Failed to load blogs. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400 overflow-x-hidden">
            <Navbar />

            <main className="pt-32 pb-24 px-4 md:px-10 max-w-7xl mx-auto">
                <div className="flex flex-col items-start gap-4 mb-20">
                    <div className="bg-yellow-400 px-4 py-2 font-black uppercase text-sm border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Thoughts & Insights
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black uppercase leading-[0.9]">
                        The Blog
                    </h1>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <SkeletonBlogCard key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-black uppercase text-red-500">{error}</h2>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map(blog => (
                                <div key={blog.id} className="h-full">
                                    <BlogCard blog={blog} />
                                </div>
                            ))}
                        </div>

                        {blogs.length === 0 && (
                            <div className="text-center py-20">
                                <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                                <h2 className="text-2xl font-black uppercase text-gray-400">No Posts Yet</h2>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BlogPage;
