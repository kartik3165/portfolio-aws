import React, { useState, useEffect } from 'react';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import MarkdownToolbar from './MarkdownToolbar';
import { addBlog, updateBlog } from '../../api/blog';
import { getPresignedUrl, uploadFileToUrl } from '../../api/upload';
import { compressImage } from '../utils/image';
import { uploadFile } from '../../api/upload';
import { slugify } from '../utils/string';

const BlogForm = ({ blog, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        excerpt: '',
        author: '',
        date: new Date().toISOString().split('T')[0],
        readtime: '',
        image: '',
        gallery: [],
        tags: '',
        content: '',
        is_draft: false
    });
    const [loading, setLoading] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);


    useEffect(() => {
        if (blog) {
            setFormData({
                ...blog,
                tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags
            });
        }
    }, [blog]);

    // Escape key handler for fullscreen
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isFullscreen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'slug') {
            setFormData(prev => ({ ...prev, [name]: slugify(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input value to allow re-uploading the same file
        e.target.value = '';

        setUploadingField(field);
        try {
            // 1. Compress
            const compressedFile = await compressImage(file);

            // 2. Get Presigned URL
            // Generate a unique filename and sanitize it
            // const sanitizedName = compressedFile.name.replace(/\s+/g, '_');
            // const filename = `${Date.now()}-${sanitizedName}`;

            // 3. Upload
            // await uploadFileToUrl(upload_url, compressedFile);

            const { public_url } = await uploadFile(compressedFile, 'blog');

            // 4. Update State
            if (field === 'image') {
                setFormData(prev => ({ ...prev, image: public_url }));
            } else if (field === 'gallery') {
                setFormData(prev => ({ ...prev, gallery: [...prev.gallery, public_url] }));
            }

        } catch (err) {
            console.error("Upload failed", err);
            setError("Image upload failed");
        } finally {
            setUploadingField(null);
        }
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        };

        try {
            if (blog) {
                await updateBlog(blog._id || blog.id, payload);
            } else {
                await addBlog(payload);
            }
            onSave();
        } catch (err) {
            console.error("Save failed", err);
            setError("Failed to save blog post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{blog ? 'Edit Blog Post' : 'Create New Blog Post'}</h3>
                <div className="flex items-center gap-4">
                    <label className="flex items-center space-x-2 mr-4 cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_draft"
                            checked={formData.is_draft || false}
                            onChange={handleChange}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Draft</span>
                    </label>
                    <button type="button" onClick={onCancel} className="mr-4 text-gray-600 hover:text-gray-800">Cancel</button>
                    <button type="submit" disabled={loading || !!uploadingField} className="neo-button-primary disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Post'}
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <input className="neo-input" name="title" placeholder="Blog Title" value={formData.title} onChange={handleChange} required />
                    <input className="neo-input" name="slug" placeholder="Slug (URL Friendly)" value={formData.slug} onChange={handleChange} required />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="neo-input" name="author" placeholder="Author" value={formData.author} onChange={handleChange} required />
                        <input className="neo-input" name="readtime" placeholder="Read Time (e.g. 5 min)" value={formData.readtime} onChange={handleChange} />
                    </div>
                    <input className="neo-input" type="date" name="date" value={formData.date} onChange={handleChange} required />
                    <textarea className="neo-input h-24 resize-y" name="excerpt" placeholder="Short Excerpt" value={formData.excerpt} onChange={handleChange} required />
                    <input className="neo-input" name="tags" placeholder="Tags (comma separated)" value={formData.tags} onChange={handleChange} />
                </div>

                <div className="space-y-4">
                    {/* Main Image */}
                    <div className="neo-card bg-gray-50 relative">
                        <label className="block text-sm font-bold mb-2">Main Image</label>
                        {uploadingField === 'image' && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0115.373 0H12v4.291c2.16 0 4.12.86 5.6 2.291l-1.6 1.71z"></path>
                                </svg>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} disabled={!!uploadingField} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        {formData.image && <img src={formData.image} alt="Main" className="mt-2 h-32 object-cover rounded border border-gray-300" />}
                    </div>

                    {/* Gallery */}
                    <div className="neo-card bg-gray-50 relative">
                        <label className="block text-sm font-bold mb-2">Gallery Images</label>
                        {uploadingField === 'gallery' && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                <div className="flex flex-col items-center">
                                    <svg className="animate-spin h-6 w-6 text-indigo-600 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0115.373 0H12v4.291c2.16 0 4.12.86 5.6 2.291l-1.6 1.71z"></path>
                                    </svg>
                                    <span className="text-xs font-bold text-indigo-600 animate-pulse">Uploading...</span>
                                </div>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} disabled={!!uploadingField} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        <div className="mt-2 flex flex-wrap gap-2">
                            {formData.gallery.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img src={img} alt={`Gallery ${idx}`} className="h-16 w-16 object-cover rounded border border-gray-300" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const md = `![Image](${img})`;
                                            navigator.clipboard.writeText(md);
                                            alert("Copied Markdown to clipboard!");
                                        }}
                                        className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Copy Markdown"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                                        </svg>
                                    </button>
                                    <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Screen Editor */}
            <div className={`${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : ''} transition-all duration-300`}>
                <div className={`${isFullscreen ? 'h-screen' : ''} ${isDarkMode ? 'bg-gray-900' : ''}`}>
                    {/* Control Bar */}
                    <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {isFullscreen ? 'Fullscreen Editor' : 'Markdown Editor'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Dark Mode Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                {isDarkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                    </svg>
                                )}
                            </button>
                            {/* Fullscreen Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
                            >
                                {isFullscreen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Editor and Preview */}
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isFullscreen ? 'h-[calc(100vh-3rem)] p-6' : 'h-[600px] border-t border-gray-200 pt-6'}`}>
                        <div className="flex flex-col h-full">
                            <label className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Content (Markdown)</label>
                            <MarkdownToolbar />
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className={`flex-1 font-mono text-sm p-4 resize-none focus:ring-2 focus:ring-indigo-500 rounded-lg border ${isDarkMode
                                    ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
                                    : 'neo-input'
                                    }`}
                                placeholder="# Start writing your blog post here..."
                            />
                        </div>
                        <div className={`flex flex-col h-full rounded-lg border overflow-hidden ${isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                            }`}>
                            <label className={`text-sm font-bold p-2 border-b block ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-gray-100 border-gray-200 text-gray-700'
                                }`}>Preview</label>
                            <div className={`flex-1 overflow-y-auto p-4 ${isDarkMode
                                ? '!bg-gray-800'
                                : '!bg-gray-50'
                                }`}>
                                <MarkdownRenderer content={formData.content || '*Preview will appear here*'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default BlogForm;
