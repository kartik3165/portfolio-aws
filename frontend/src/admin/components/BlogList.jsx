import React from 'react';

const BlogList = ({ blogs, onEdit, onDelete, onComments }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-12">
                    No blog posts found. Create one to get started!
                </div>
            ) : (
                blogs.map(blog => (
                    <div key={blog._id || blog.id} className="neo-card hover:border-indigo-300 transition-colors flex flex-col">
                        {blog.image && (
                            <div className="relative">
                                <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover rounded-md mb-4 border border-gray-200" />
                                {blog.is_draft && (
                                    <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200 shadow-sm">
                                        Draft
                                    </span>
                                )}
                            </div>
                        )}
                        {!blog.image && blog.is_draft && (
                            <div className="mb-2">
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">
                                    Draft
                                </span>
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                        <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                            <span>{blog.author}</span>
                            <span>&bull;</span>
                            <span>{new Date(blog.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-3 flex-1">{blog.excerpt}</p>
                        <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-4 gap-2">
                            <button onClick={() => onEdit(blog)} className="text-indigo-600 font-medium hover:text-indigo-800 text-sm">Edit</button>
                            <button onClick={() => onComments(blog)} className="text-gray-600 font-medium hover:text-gray-800 text-sm flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                Comments
                            </button>
                            <button
                                onClick={() => {
                                    const url = `https://kanbs.me/blog/${blog.slug}`;
                                    navigator.clipboard.writeText(url);
                                    alert(`Copied link: ${url}`);
                                }}
                                className="text-teal-600 font-medium hover:text-teal-800 text-sm flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                Share
                            </button>
                            <button onClick={() => onDelete(blog._id || blog.id)} className="text-red-500 font-medium hover:text-red-700 text-sm">Delete</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default BlogList;
