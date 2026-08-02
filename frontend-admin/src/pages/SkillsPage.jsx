import React from 'react';
import SkillsSection from '../components/SkillsSection';
import { Link } from 'react-router-dom';

const SkillsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 border-none bg-transparent shadow-none tracking-normal">
                        Skills
                    </h1>
                    <Link to="/" className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                <SkillsSection />
            </div>
        </div>
    );
};

export default SkillsPage;
