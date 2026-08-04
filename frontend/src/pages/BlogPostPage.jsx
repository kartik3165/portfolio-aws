import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CommentSection from '../components/CommentSection';
import { api } from '../api/client';
import useScrollTracking from "../hooks/useScrollTracking";
import { ArrowLeft, Clock, Calendar, User, Share2, Check } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

const BlogPostPage = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useScrollTracking();

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchBlog = async () => {
            setLoading(true);
            try {
                const data = await api.getBlogBySlug(slug);
                setBlog(data);

                if (window.gtag) {
                    window.gtag("event", "blog_view", {
                        blog_slug: slug,
                        blog_title: data.title
                    });
                }

            } catch (err) {
                console.error("Failed to fetch blog:", err);
                setError("Blog post not found.");
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400">
                <Navbar />
                <main className="pt-32 pb-24 px-4 md:px-10 max-w-4xl mx-auto" aria-hidden="true">
                    <Skeleton className="h-5 w-40 mb-12" />
                    <div className="flex flex-wrap gap-4 mb-6">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-12 w-full mb-4" />
                    <Skeleton className="h-12 w-3/4 mb-8" />
                    <div className="flex items-center gap-3 border-y-2 border-black/10 py-6 mb-8">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-72 w-full border-[3px] border-black mb-8 rounded-none" />
                    <Skeleton className="h-5 w-full mb-3" />
                    <Skeleton className="h-5 w-full mb-3" />
                    <Skeleton className="h-5 w-full mb-3" />
                    <Skeleton className="h-5 w-2/3 mb-3" />
                    <Skeleton className="h-5 w-5/6 mb-3" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
                <h1 className="text-4xl font-black mb-4">Post Not Found</h1>
                <Link to="/blog" className="text-xl font-bold underline">Back to Blog</Link>
            </div>
        );
    }

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400 overflow-x-hidden">
            <Navbar />

            <main className="pt-32 pb-24 px-4 md:px-10 max-w-4xl mx-auto">
                <Link to="/blog" className="inline-flex items-center gap-2 font-black mb-12 hover:underline uppercase text-sm tracking-widest">
                    <ArrowLeft size={20} /> Back to All Posts
                </Link>

                <article>
                    {/* Header */}
                    <header className="mb-12">
                        <div className="flex flex-wrap gap-4 mb-6 text-sm font-bold uppercase tracking-wider text-gray-500">
                            {blog.tags && blog.tags.length > 0 && (
                                <div className="bg-yellow-400 text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {blog.tags[0]}
                                </div>
                            )}
                            <span className="flex items-center gap-2"><Calendar size={16} /> {blog.date}</span>
                            <span className="flex items-center gap-2"><Clock size={16} /> {blog.readTime || blog.readtime}</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.95] mb-8">
                            {blog.title}
                        </h1>

                        <div className="flex items-center justify-between border-y-2 border-black/10 py-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black rounded-full text-white flex items-center justify-center font-bold">
                                    {blog.author ? blog.author.charAt(0) : 'K'}
                                </div>
                                <span className="font-bold uppercase">{blog.author}</span>
                            </div>
                            <button
                                onClick={async () => {
                                    const url = window.location.href;
                                    if (window.gtag) {
                                        window.gtag("event", "share_blog", {
                                            blog_slug: slug
                                        });
                                    }
                                    if (navigator.share) {
                                        try {
                                            await navigator.share({
                                                title: blog.title,
                                                text: blog.content?.slice(0, 100) + '...', // Fallback excerpt
                                                url: url
                                            });
                                        } catch (err) {
                                            console.log('Error sharing:', err);
                                        }
                                    } else {
                                        navigator.clipboard.writeText(url)
                                            .then(() => {
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            })
                                            .catch(err => console.error('Failed to copy', err));
                                    }
                                }}
                                className="flex items-center gap-2 font-bold hover:text-blue-600 transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check size={20} className="text-green-600" /> <span className="hidden md:inline text-green-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 size={20} /> <span className="hidden md:inline">Share</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {blog.image && (
                        <div className={`w-full h-auto mb-16 overflow-hidden ${brutalBorder} ${brutalShadow}`}>
                            <img src={blog.image} alt={blog.title} className="w-full h-auto object-contain" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="mb-20">
                        <MarkdownRenderer content={blog.content} />
                    </div>

                    {/* Tags Footer */}
                    <div className="flex gap-2 mb-20">
                        {blog.tags.map((tag, i) => (
                            <span key={i} className="px-4 py-2 bg-gray-100 font-bold text-sm uppercase rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </article>

                <CommentSection blogId={blog.id} />

            </main>

            <Footer />
        </div>
    );
};

export default BlogPostPage;
