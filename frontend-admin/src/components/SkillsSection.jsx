import React, { useState, useEffect } from 'react';
import { getSkills, addSkill, removeSkill } from '../api/skills';

const SkillsSection = () => {
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSkills = async () => {
        try {
            setLoading(true);
            const data = await getSkills();
            setSkills(Array.isArray(data) ? data : (data.skills || []));
        } catch (err) {
            console.error("Failed to fetch skills", err);
            setError("Failed to load skills");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (!newSkill.trim()) return;
        try {
            await addSkill(newSkill);
            setNewSkill('');
            fetchSkills();
        } catch (err) {
            console.error("Failed to add skill", err);
            setError("Failed to add skill.");
        }
    };

    const handleRemoveSkill = async (skillToRemove) => {
        if (!window.confirm("Remove this skill?")) return;

        try {
            const skillName = typeof skillToRemove === 'string' ? skillToRemove : skillToRemove.skill;
            await removeSkill(skillName);
            fetchSkills();
        } catch (err) {
            console.error("Failed to remove skill", err);
            setError("Failed to remove skill");
        }
    };

    if (loading) return <div className="text-gray-500 font-medium">Loading skills...</div>;

    return (
        <div className="neo-card mt-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 border-none bg-transparent shadow-none px-0">Skills Management</h3>
            {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm border border-red-200">{error}</div>}

            <form onSubmit={handleAddSkill} className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a new skill..."
                    className="neo-input flex-1"
                />
                <button
                    type="submit"
                    className="neo-button-primary"
                >
                    Add
                </button>
            </form>

            <div className="flex flex-wrap gap-2">
                {skills.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">No skills added yet.</p>
                ) : (
                    skills.map((skill, index) => {
                        const skillName = typeof skill === 'string' ? skill : skill.skill;
                        return (
                            <div key={index} className="flex items-center bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                                <span>{skillName}</span>
                                <button
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                                    aria-label={`Remove ${skillName}`}
                                >
                                    &times;
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SkillsSection;
