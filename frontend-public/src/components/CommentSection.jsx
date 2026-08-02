import React, { useState, useEffect } from 'react';
import { User, MessageSquare, Send, Loader2 } from 'lucide-react';
import { api } from '../api/client';

const CommentSection = ({ blogId }) => {
    const [comments, setComments] = useState([]);
    const [name, setName] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const brutalBorder = "border-[3px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    const inputStyle = `w-full bg-gray-50 p-3 font-bold ${brutalBorder} focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all`;

    // Load comments
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const data = await api.getComments(blogId);
                setComments(data || []);
            } catch (err) {
                console.error("Failed to fetch comments:", err);
            } finally {
                setLoading(false);
            }
        };
        if (blogId) fetchComments();
    }, [blogId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !body.trim()) {
            setError('Please fill in both fields.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const newComment = await api.createComment(blogId, { name, body });
            setComments([newComment, ...comments]);
            setName('');
            setBody('');
            setIsFormOpen(false); // Close form on success
        } catch (err) {
            console.error("Failed to post comment:", err);
            setError("Failed to post comment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="mt-20 py-12 px-6 md:px-12 bg-yellow-50 border-t-[4px] border-black">
            <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-black uppercase mb-8 flex items-center gap-3">
                    <MessageSquare size={32} /> Discussion ({comments.length})
                </h3>

                {/* Comments List */}
                <div className="space-y-6 mb-12">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 size={32} className="animate-spin text-gray-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-gray-500 font-bold italic mb-8">No comments yet. Be the first to share!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className={`bg-white p-6 ${brutalBorder} flex gap-4`}>
                                <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-black">
                                    <User size={20} />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <span className="font-black uppercase mr-3">{comment.name}</span>
                                            <span className="text-xs font-bold text-gray-500">{comment.date}</span>
                                        </div>
                                    </div>
                                    <p className="font-medium text-gray-800 leading-relaxed">
                                        {comment.body}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Comment Section */}
                <div className="border-t-2 border-dashed border-gray-400 pt-8">
                    {!isFormOpen ? (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className={`bg-black text-white px-6 py-3 font-black uppercase tracking-wider ${brutalBorder} border-black hover:bg-white hover:text-black transition-all flex items-center gap-2`}
                        >
                            Add a Comment <MessageSquare size={18} />
                        </button>
                    ) : (
                        <div className={`bg-white p-6 md:p-8 ${brutalBorder} ${brutalShadow} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black uppercase text-xl">Leave a Reply</h4>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="text-sm font-bold uppercase underline hover:text-red-600"
                                >
                                    Cancel
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-black uppercase text-sm">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        className={inputStyle}
                                        disabled={submitting}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-black uppercase text-sm">Comment</label>
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Share your thoughts..."
                                        rows="4"
                                        className={inputStyle}
                                        disabled={submitting}
                                    />
                                </div>

                                {error && <p className="text-red-600 font-bold text-sm">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`bg-black text-white px-6 py-3 font-black uppercase tracking-widest flex items-center justify-center gap-2 ${brutalBorder} hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50`}
                                >
                                    {submitting ? 'Posting...' : 'Post Comment'} <Send size={18} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CommentSection;
