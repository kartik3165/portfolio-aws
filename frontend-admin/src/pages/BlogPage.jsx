import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BlogList from '../components/BlogList';
import BlogForm from '../components/BlogForm';
import CommentsModal from '../components/CommentsModal';
import { getAdminBlogs, deleteBlog } from '../api/blog';

const BlogPage = () => {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [blogs, setBlogs] = useState([]);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [loading, setLoading] = useState(false);

    // Comments Modal State
    const [showComments, setShowComments] = useState(false);
    const [selectedBlogForComments, setSelectedBlogForComments] = useState(null);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            // Admin endpoint includes drafts; auth comes from session cookies
            const data = await getAdminBlogs();
            setBlogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleCreate = () => {
        setSelectedBlog(null);
        setView('form');
    };

    const handleOpenComments = (blog) => {
        setSelectedBlogForComments(blog);
        setShowComments(true);
    };

    const handleCloseComments = () => {
        setShowComments(false);
        setSelectedBlogForComments(null);
    };

    const handleEdit = (blog) => {
        setSelectedBlog(blog);
        setView('form');
    };

    const handleSave = () => {
        setView('list');
        fetchBlogs();
    };

    const handleCancel = () => {
        setView('list');
        setSelectedBlog(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this blog post?")) return;

        try {
            await deleteBlog(id);
            fetchBlogs();
        } catch (error) {
            console.error(error);
            alert("Failed to delete blog.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 border-none bg-transparent shadow-none tracking-normal">
                        Blog Management
                    </h1>
                    <div className="flex gap-4">
                        {view === 'list' && (
                            <button onClick={handleCreate} className="neo-button-primary">
                                + Create New Post
                            </button>
                        )}
                        <Link to="/" className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">
                            &larr; Back to Dashboard
                        </Link>
                    </div>
                </div>

                {view === 'list' ? (
                    loading ? (
                        <div className="text-center py-12 text-gray-500">Loading blogs...</div>
                    ) : (
                        <BlogList
                            blogs={blogs}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onComments={handleOpenComments}
                        />
                    )
                ) : (
                    <BlogForm blog={selectedBlog} onSave={handleSave} onCancel={handleCancel} />
                )}

                {showComments && (
                    <CommentsModal
                        blog={selectedBlogForComments}
                        onClose={handleCloseComments}
                    />
                )}
            </div>
        </div>
    );
};

export default BlogPage;
