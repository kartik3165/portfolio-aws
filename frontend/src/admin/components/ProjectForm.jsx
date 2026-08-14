import React, { useState, useEffect } from 'react';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import MarkdownToolbar from './MarkdownToolbar';
import { addProject, updateProject } from '../../api/projects';
import { compressImage } from '../utils/image';
import { slugify } from '../utils/string';
import { uploadFile } from '../../api/upload';
import MermaidEditor from './MermaidEditor';

const ProjectForm = ({ project, onSave, onCancel }) => {
    // Initial State - Matching the extensive schema
    const [formData, setFormData] = useState({
        slug: '',
        name: '',
        subtitle: '',
        shortDesc: '',
        fullDesc: '', // Markdown
        stats: [], // { label, value }
        problem: '',
        solution: '',
        outcome: '',
        architectureMermaid: '',
        challenges: [], // string[]
        learnings: [], // string[]
        future: [], // string[]
        tech: [], // { name, purpose }
        coverImage: '',
        color: '#000000',
        github: '',
        live: '',
        document: '',
        features: [], // string[]
        screenshots: [], // string[]
        is_draft: false
    });

    const [loading, setLoading] = useState(false);
    const [uploadingField, setUploadingField] = useState(null); // 'coverImage', 'screenshots', or null
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('basic'); // basic, details, media, lists, tech
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);



    useEffect(() => {
        if (project) {
            setFormData(prev => ({
                ...prev,
                ...project,
                // Ensure arrays are arrays even if backend returns null/undefined
                stats: project.stats || [],
                architectureMermaid: project.architectureMermaid || '',
                challenges: project.challenges || [],
                learnings: project.learnings || [],
                future: project.future || [],
                tech: project.tech || [],
                features: project.features || [],
                screenshots: project.screenshots || []
            }));
        }
    }, [project]);

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

    // --- Array Field Handlers (String Arrays) ---
    const handleArrayChange = (index, value, field) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeArrayItem = (index, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // --- Complex Array Handlers (Object Arrays) ---
    // Stats: { label, value }
    const handleStatChange = (index, key, value) => {
        const newStats = [...formData.stats];
        newStats[index] = { ...newStats[index], [key]: value };
        setFormData(prev => ({ ...prev, stats: newStats }));
    };

    const addStat = () => {
        setFormData(prev => ({ ...prev, stats: [...prev.stats, { label: '', value: '' }] }));
    };

    const removeStat = (index) => {
        setFormData(prev => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));
    };

    // Tech: { name, purpose }
    const handleTechChange = (index, key, value) => {
        const newTech = [...formData.tech];
        newTech[index] = { ...newTech[index], [key]: value };
        setFormData(prev => ({ ...prev, tech: newTech }));
    };

    const addTech = () => {
        setFormData(prev => ({ ...prev, tech: [...prev.tech, { name: '', purpose: '' }] }));
    };

    const removeTech = (index) => {
        setFormData(prev => ({ ...prev, tech: prev.tech.filter((_, i) => i !== index) }));
    };


    // --- Image Upload ---
    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input value to allow re-uploading the same file
        e.target.value = '';

        setUploadingField(field);
        try {
            const compressedFile = await compressImage(file);
            // Use original name for GIFs to keep extension, or ensure webp extension for others
            // compressImage now handles this check internally for the file object, but we might want to sanitize the name

            const { public_url } = await uploadFile(compressedFile, 'projects');

            if (field === 'screenshots') {
                setFormData(prev => ({ ...prev, screenshots: [...prev.screenshots, public_url] }));
            } else {
                setFormData(prev => ({ ...prev, [field]: public_url }));
            }
        } catch (err) {
            console.error("Upload failed", err);
            setError("Image upload failed");
        } finally {
            setUploadingField(null);
        }
    };

    const removeScreenshot = (index) => {
        setFormData(prev => ({
            ...prev,
            screenshots: prev.screenshots.filter((_, i) => i !== index)
        }));
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (project) {
                await updateProject(project._id || project.id, formData);
            } else {
                await addProject(formData);
            }
            onSave();
        } catch (err) {
            console.error("Save failed", err);
            setError("Failed to save project");
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
            {label}
        </button>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{project ? 'Edit Project' : 'Add New Project'}</h3>
                <div className="space-x-4 flex items-center">
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
                    <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
                    <button type="submit" disabled={loading || !!uploadingField} className="neo-button-primary disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Project'}
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 mb-6">
                <TabButton id="basic" label="Basic Info" />
                <TabButton id="details" label="Case Study (MD)" />
                <TabButton id="media" label="Media & Links" />
                <TabButton id="tech" label="Tech & Stats" />
                <TabButton id="lists" label="Features & Lists" />
            </div>

            {/* --- BASIC INFO TAB --- */}
            {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="col-span-full md:col-span-1 space-y-4">
                        <input className="neo-input" name="name" placeholder="Project Name" value={formData.name} onChange={handleChange} required />
                        <input className="neo-input" name="subtitle" placeholder="Subtitle" value={formData.subtitle} onChange={handleChange} />
                        <input className="neo-input" name="slug" placeholder="Slug (URL Friendly)" value={formData.slug} onChange={handleChange} required />
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700">Theme Color:</label>
                            <input type="color" name="color" value={formData.color} onChange={handleChange} className="h-10 w-20 p-1 rounded border border-gray-300 cursor-pointer" />
                        </div>
                    </div>
                    <div className="col-span-full md:col-span-1">
                        <textarea className="neo-input h-full resize-none" name="shortDesc" placeholder="Short Description" value={formData.shortDesc} onChange={handleChange} required />
                    </div>
                </div>
            )}

            {/* --- DETAILS TAB (Markdown) --- */}
            {activeTab === 'details' && (
                <div className="space-y-6 animate-fade-in">
                    <p className="text-sm text-gray-500">Use the Full Description for your main Markdown content. Problem, Solution, and Outcome are summary text fields.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <textarea className="neo-input h-32" name="problem" placeholder="The Problem" value={formData.problem} onChange={handleChange} />
                        <textarea className="neo-input h-32" name="solution" placeholder="The Solution" value={formData.solution} onChange={handleChange} />
                        <textarea className="neo-input h-32" name="outcome" placeholder="The Outcome" value={formData.outcome} onChange={handleChange} />
                    </div>

                    {/* Expanded Editor Area */}
                    <div className={`${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : ''} transition-all duration-300`}>
                        <div className={`${isFullscreen ? 'h-screen' : ''} ${isDarkMode ? 'bg-gray-900' : ''}`}>
                            {/* Control Bar */}
                            <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {isFullscreen ? 'Fullscreen Editor' : 'Detailed Markdown Description'}
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

                            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isFullscreen ? 'h-[calc(100vh-3rem)] p-6' : 'h-[500px] border-t border-gray-200 pt-6'}`}>
                                <div className="flex flex-col h-full">
                                    <label className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Full Description (Markdown)</label>
                                    <MarkdownToolbar />
                                    <textarea
                                        name="fullDesc"
                                        value={formData.fullDesc}
                                        onChange={handleChange}
                                        className={`flex-1 font-mono text-sm p-4 resize-none focus:ring-2 focus:ring-indigo-500 rounded-lg border ${isDarkMode
                                            ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
                                            : 'neo-input'
                                            }`}
                                        placeholder="# Write your case study here..."
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
                                        <MarkdownRenderer content={formData.fullDesc || '*Preview will appear here*'} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MEDIA & LINKS TAB --- */}
            {activeTab === 'media' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input className="neo-input" name="github" placeholder="GitHub URL" value={formData.github} onChange={handleChange} />
                        <input className="neo-input" name="live" placeholder="Live Site URL" value={formData.live} onChange={handleChange} />
                        <input className="neo-input" name="document" placeholder="Documentation URL" value={formData.document} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="neo-card bg-gray-50 relative">
                            <label className="block text-sm font-bold mb-2">Cover Image</label>
                            <input type="file" onChange={e => handleImageUpload(e, 'coverImage')} disabled={!!uploadingField} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                            {formData.coverImage && <img src={formData.coverImage} alt="Cover" className="mt-2 h-40 w-full object-cover rounded border border-gray-300" />}
                            {uploadingField === 'coverImage' && (
                                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm pointer-events-none">
                                    <span className="text-sm font-bold text-indigo-600 animate-pulse">Uploading...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="neo-card bg-gray-50 relative">
                        <label className="block text-sm font-bold mb-2">Screenshots Gallery</label>

                        {uploadingField === 'screenshots' && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                <div className="flex flex-col items-center">
                                    <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0115.373 0H12v4.291c2.16 0 4.12.86 5.6 2.291l-1.6 1.71z"></path>
                                    </svg>
                                    <span className="text-sm font-bold text-indigo-600 animate-pulse">Uploading...</span>
                                </div>
                            </div>
                        )}

                        <input type="file" multiple onChange={e => handleImageUpload(e, 'screenshots')} disabled={!!uploadingField} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {formData.screenshots.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img src={img} alt={`Screenshot ${idx}`} className="h-24 w-full object-cover rounded border border-gray-300" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const md = `![Screenshot](${img})`;
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
                                    <button type="button" onClick={() => removeScreenshot(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TECH & STATS TAB --- */}
            {activeTab === 'tech' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {/* Stats */}
                    <div className="neo-card space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-gray-700">Stats</h4>
                            <button type="button" onClick={addStat} className="text-sm text-indigo-600 font-medium hover:underline">+ Add Stat</button>
                        </div>
                        {formData.stats.map((stat, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input className="neo-input flex-1" placeholder="Label" value={stat.label} onChange={e => handleStatChange(idx, 'label', e.target.value)} />
                                <input className="neo-input flex-1" placeholder="Value" value={stat.value} onChange={e => handleStatChange(idx, 'value', e.target.value)} />
                                <button type="button" onClick={() => removeStat(idx)} className="text-red-500 hover:text-red-700">&times;</button>
                            </div>
                        ))}
                    </div>

                    {/* Tech Stack */}
                    <div className="neo-card space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-gray-700">Tech Stack</h4>
                            <button type="button" onClick={addTech} className="text-sm text-indigo-600 font-medium hover:underline">+ Add Tech</button>
                        </div>
                        {formData.tech.map((t, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input className="neo-input flex-1" placeholder="Name" value={t.name} onChange={e => handleTechChange(idx, 'name', e.target.value)} />
                                <input className="neo-input flex-1" placeholder="Purpose" value={t.purpose} onChange={e => handleTechChange(idx, 'purpose', e.target.value)} />
                                <button type="button" onClick={() => removeTech(idx)} className="text-red-500 hover:text-red-700">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- LISTS TAB --- */}
            {activeTab === 'lists' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Features */}
                        <div className="neo-card">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700">Features</h4>
                                <button type="button" onClick={() => addArrayItem('features')} className="text-sm text-indigo-600 font-medium">+ Add</button>
                            </div>
                            {formData.features.map((item, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input className="neo-input w-full" value={item} onChange={e => handleArrayChange(idx, e.target.value, 'features')} />
                                    <button type="button" onClick={() => removeArrayItem(idx, 'features')} className="text-red-500">&times;</button>
                                </div>
                            ))}
                        </div>
                        {/* System Architecture (Mermaid) */}
                        <div className="neo-card col-span-full">
                            <MermaidEditor
                                label="System Architecture (Mermaid)"
                                value={formData.architectureMermaid}
                                onChange={(val) => setFormData(prev => ({ ...prev, architectureMermaid: val }))}
                            />
                        </div>
                        {/* Challenges */}
                        <div className="neo-card">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700">Challenges</h4>
                                <button type="button" onClick={() => addArrayItem('challenges')} className="text-sm text-indigo-600 font-medium">+ Add</button>
                            </div>
                            {formData.challenges.map((item, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input className="neo-input w-full" value={item} onChange={e => handleArrayChange(idx, e.target.value, 'challenges')} />
                                    <button type="button" onClick={() => removeArrayItem(idx, 'challenges')} className="text-red-500">&times;</button>
                                </div>
                            ))}
                        </div>
                        {/* Learnings */}
                        <div className="neo-card">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700">Learnings</h4>
                                <button type="button" onClick={() => addArrayItem('learnings')} className="text-sm text-indigo-600 font-medium">+ Add</button>
                            </div>
                            {formData.learnings.map((item, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input className="neo-input w-full" value={item} onChange={e => handleArrayChange(idx, e.target.value, 'learnings')} />
                                    <button type="button" onClick={() => removeArrayItem(idx, 'learnings')} className="text-red-500">&times;</button>
                                </div>
                            ))}
                        </div>

                        {/* Future Scope */}
                        <div className="neo-card">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700">Future Scope</h4>
                                <button type="button" onClick={() => addArrayItem('future')} className="text-sm text-indigo-600 font-medium">+ Add</button>
                            </div>
                            {formData.future.map((item, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input className="neo-input w-full" value={item} onChange={e => handleArrayChange(idx, e.target.value, 'future')} />
                                    <button type="button" onClick={() => removeArrayItem(idx, 'future')} className="text-red-500">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </form>
    );
};

export default ProjectForm;
