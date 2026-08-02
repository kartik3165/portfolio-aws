import React, { useState, useEffect } from 'react';
import { getComments, deleteComment } from '../api/blog';

const CommentsModal = ({ blog, onClose }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        if (!blog) return;
        setLoading(true);
        try {
            const data = await getComments(blog._id || blog.id);
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [blog]);

    const handleDelete = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;

        try {
            await deleteComment(blog._id || blog.id, commentId);
            fetchComments(); // Refresh list
        } catch (error) {
            console.error("Failed to delete comment", error);
            alert("Failed to delete comment.");
        }
    };

    if (!blog) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col neo-card p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900 truncate pr-4">Comments for: {blog.title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading comments...</div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic">No comments found.</div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment, index) => (
                                <div key={comment._id || comment.id || index} className="border border-gray-200 rounded p-3 bg-gray-50 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-gray-800 text-sm">{comment.author || comment.writer || comment.name || comment.username || 'Anonymous'}</div>
                                        <div className="text-xs text-gray-400">{comment.date || comment.created_at ? new Date(comment.date || comment.created_at).toLocaleDateString() : ''}</div>
                                    </div>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content || comment.comment || comment.text || comment.message}</p>

                                    <button
                                        onClick={() => handleDelete(comment._id || comment.id)}
                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Comment"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
                    <button onClick={onClose} className="neo-button text-gray-600 border-gray-300 hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>
    );
};

export default CommentsModal;
