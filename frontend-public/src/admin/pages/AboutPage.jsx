import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getExperiences, addExperience, updateExperience, deleteExperience,
    getResearchPapers, addResearchPaper, updateResearchPaper, deleteResearchPaper,
    getAchievements, addAchievement, updateAchievement, deleteAchievement,
    getBio, updateBio
} from '../../api/about';
import { uploadFile } from '../../api/upload';
import { compressImage } from '../utils/image';


const BioSection = () => {
    const [form, setForm] = useState({
        summary: '',
        highlights: '',
        about_intro: '',
        story: '',
        hero_image: '',
        about_image: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);

    useEffect(() => {
        const fetchBio = async () => {
            setLoading(true);
            try {
                const data = await getBio();
                setForm(prev => ({
                    ...prev,
                    summary: data.summary || '',
                    highlights: Array.isArray(data.highlights) ? data.highlights.join('\n') : data.highlights || '',
                    about_intro: data.about_intro || '',
                    story: data.story || '',
                    hero_image: data.hero_image || '',
                    about_image: data.about_image || ''
                }));
            } catch (error) { console.error(error); }
            setLoading(false);
        };
        fetchBio();
    }, []);

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input value
        e.target.value = '';

        setUploadingField(field);

        try {
            // 1. Compress
            const compressedFile = await compressImage(file);

            // 2. Upload
            const { public_url } = await uploadFile(compressedFile, 'bio');

            // 3. Update State
            setForm(prev => ({ ...prev, [field]: public_url }));

        } catch (err) {
            console.error("Upload failed", err);
            alert("Image upload failed.");
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            highlights: form.highlights.split('\n').filter(line => line.trim() !== '')
        };
        try {
            await updateBio(payload);
            alert("Bio updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to update bio.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="neo-card space-y-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 border-none bg-transparent shadow-none px-0">Manage Bio</h3>

            {/* Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hero Image */}
                <div className="neo-card bg-gray-50 relative p-4">
                    <label className="block text-sm font-bold mb-2">Hero Image</label>
                    {uploadingField === 'hero_image' && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                            <span className="text-xs font-bold text-indigo-600 animate-pulse">Uploading...</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'hero_image')}
                        disabled={!!uploadingField}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {form.hero_image && (
                        <img src={form.hero_image} alt="Hero" className="mt-3 h-32 w-full object-cover rounded border border-gray-300" />
                    )}
                </div>

                {/* About Image */}
                <div className="neo-card bg-gray-50 relative p-4">
                    <label className="block text-sm font-bold mb-2">About Page Image</label>
                    {uploadingField === 'about_image' && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                            <span className="text-xs font-bold text-indigo-600 animate-pulse">Uploading...</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'about_image')}
                        disabled={!!uploadingField}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {form.about_image && (
                        <img src={form.about_image} alt="About" className="mt-3 h-32 w-full object-cover rounded border border-gray-300" />
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Section Text (Summary)</label>
                <textarea className="neo-input h-24 resize-y" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (One per line)</label>
                <textarea className="neo-input h-32 resize-y" value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })} placeholder="NEC 2025 Finalist&#10;Fashion Club President" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Who I Am (About Intro)</label>
                <textarea className="neo-input h-24 resize-y" value={form.about_intro} onChange={e => setForm({ ...form, about_intro: e.target.value })} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">My Story</label>
                <textarea className="neo-input h-48 resize-y" value={form.story} onChange={e => setForm({ ...form, story: e.target.value })} />
            </div>

            <div className="flex gap-3 mt-4 items-center">
                <button type="submit" disabled={loading || !!uploadingField} className="neo-button-primary disabled:opacity-50">Save Changes</button>
            </div>
        </form>
    );
};

const ExperienceSection = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ role: '', company: '', period: '', location: '', description: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await getExperiences();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching experience", error);
        }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            description: form.description.split('\n')
        };
        try {
            if (editingId) {
                await updateExperience(editingId, payload);
            } else {
                await addExperience(payload);
            }
            setForm({ role: '', company: '', period: '', location: '', description: '' });
            setEditingId(null);
            fetchItems();
        } catch (error) {
            console.error("Error saving experience", error);
            alert("Failed to save experience.");
        }
    };

    const handleEdit = (item) => {
        setForm({
            role: item.role,
            company: item.company,
            period: item.period,
            location: item.location,
            description: Array.isArray(item.description) ? item.description.join('\n') : item.description || ''
        });
        setEditingId(item._id || item.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;

        try {
            await deleteExperience(id);
            fetchItems();
        } catch (error) {
            console.error("Error deleting experience", error);
            alert("Failed to delete experience.");
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="neo-card mt-4">
                <h3 className="text-lg font-bold mb-4 text-gray-900 border-none bg-transparent shadow-none px-0">
                    {editingId ? 'Edit Experience' : 'Add Experience'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input className="neo-input" placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required />
                    <input className="neo-input" placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} required />
                    <input className="neo-input" placeholder="Period" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} required />
                    <input className="neo-input" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                </div>
                <textarea className="neo-input h-24 resize-y" placeholder="Description (One per line)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="flex gap-3 mt-4 items-center">
                    <button type="submit" className="neo-button-primary">{editingId ? 'Update' : 'Add'}</button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ role: '', company: '', period: '', location: '', description: '' }); }} className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">Cancel</button>}
                </div>
            </form>

            <div className="space-y-4">
                {items.map(item => (
                    <div key={item._id || item.id} className="neo-card flex justify-between items-start hover:shadow-md hover:border-gray-300">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900">{item.role} <span className="text-gray-500 font-normal">at</span> {item.company}</h4>
                            <p className="text-sm text-gray-500 mt-1">{item.period} | {item.location}</p>
                            <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-gray-700">
                                {Array.isArray(item.description) && item.description.map((desc, i) => <li key={i}>{desc}</li>)}
                            </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(item._id || item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ResearchPaperSection = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', publication: '', description: '', tags: '', link: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await getResearchPapers();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            tags: form.tags.split(',').map(tag => tag.trim()).filter(t => t)
        };
        try {
            if (editingId) await updateResearchPaper(editingId, payload);
            else await addResearchPaper(payload);
            setForm({ title: '', publication: '', description: '', tags: '', link: '' });
            setEditingId(null);
            fetchItems();
        } catch (error) {
            console.error(error);
            alert("Failed to save paper.");
        }
    };

    const handleEdit = (item) => {
        setForm({
            title: item.title,
            publication: item.publication,
            description: item.description,
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
            link: item.link
        });
        setEditingId(item._id || item.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try { await deleteResearchPaper(id); fetchItems(); } catch (error) { console.error(error); alert("Failed to delete paper."); }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="neo-card mt-4">
                <h3 className="text-lg font-bold mb-4 text-gray-900 border-none bg-transparent shadow-none px-0">
                    {editingId ? 'Edit Paper' : 'Add Paper'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input className="neo-input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    <input className="neo-input" placeholder="Publication" value={form.publication} onChange={e => setForm({ ...form, publication: e.target.value })} required />
                    <input className="neo-input" placeholder="Link" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
                    <input className="neo-input" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
                <textarea className="neo-input h-24 resize-y" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="flex gap-3 mt-4 items-center">
                    <button type="submit" className="neo-button-primary">{editingId ? 'Update' : 'Add'}</button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', publication: '', description: '', tags: '', link: '' }); }} className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">Cancel</button>}
                </div>
            </form>
            <div className="space-y-4">
                {items.map(item => (
                    <div key={item._id || item.id} className="neo-card flex justify-between items-start hover:shadow-md hover:border-gray-300">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">{item.publication}</span>
                            <p className="mt-2 text-gray-700 text-sm">{item.description}</p>
                            <div className="mt-3 flex gap-2 flex-wrap">
                                {Array.isArray(item.tags) && item.tags.map((tag, i) => <span key={i} className="neo-tag">{tag}</span>)}
                            </div>
                            {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-medium text-indigo-600 text-sm hover:underline">Read Paper &rarr;</a>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(item._id || item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AchievementSection = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', description: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await getAchievements();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form };
        try {
            if (editingId) await updateAchievement(editingId, payload);
            else await addAchievement(payload);
            setForm({ title: '', description: '' });
            setEditingId(null);
            fetchItems();
        } catch (error) {
            console.error(error);
            alert("Failed to save achievement.");
        }
    };

    const handleEdit = (item) => {
        setForm({ title: item.title, description: item.description });
        setEditingId(item._id || item.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try { await deleteAchievement(id); fetchItems(); } catch (error) { console.error(error); alert("Failed to delete."); }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="neo-card mt-4">
                <h3 className="text-lg font-bold mb-4 text-gray-900 border-none bg-transparent shadow-none px-0">
                    {editingId ? 'Edit Achievement' : 'Add Achievement'}
                </h3>
                <div className="mb-4">
                    <input className="neo-input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <textarea className="neo-input h-24 resize-y" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                <div className="flex gap-3 mt-4 items-center">
                    <button type="submit" className="neo-button-primary">{editingId ? 'Update' : 'Add'}</button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '' }); }} className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">Cancel</button>}
                </div>
            </form>
            <div className="space-y-4">
                {items.map(item => (
                    <div key={item._id || item.id} className="neo-card flex justify-between items-start hover:shadow-md hover:border-gray-300">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                            <p className="mt-1 text-gray-700 text-sm">{item.description}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(item._id || item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const AboutPage = () => {
    const [activeTab, setActiveTab] = useState('bio');

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 border-none bg-transparent shadow-none tracking-normal">
                        About Management
                    </h1>
                    <Link to="/admin" className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('bio')} className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'bio' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Bio / Story</button>
                    <button onClick={() => setActiveTab('experience')} className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'experience' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Experience</button>
                    <button onClick={() => setActiveTab('research')} className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'research' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Research Papers</button>
                    <button onClick={() => setActiveTab('achievements')} className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'achievements' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Achievements</button>
                </div>

                {activeTab === 'bio' && <BioSection />}
                {activeTab === 'experience' && <ExperienceSection />}
                {activeTab === 'research' && <ResearchPaperSection />}
                {activeTab === 'achievements' && <AchievementSection />}
            </div>
        </div>
    );
};

export default AboutPage;
