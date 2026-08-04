import React from 'react';

const ProjectList = ({ projects, onEdit, onDelete }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-12">
                    No projects found. Add one to showcase your work!
                </div>
            ) : (
                projects.map(project => (
                    <div key={project._id || project.id} className="neo-card flex flex-col hover:border-blue-300 transition-colors">
                        {project.coverImage && (
                            <div className="relative">
                                <img src={project.coverImage} alt={project.name} className="w-full h-48 object-cover rounded-md mb-4 border border-gray-200" />
                                {project.is_draft && (
                                    <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200 shadow-sm">
                                        Draft
                                    </span>
                                )}
                            </div>
                        )}
                        {!project.coverImage && project.is_draft && (
                            <div className="mb-2">
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">
                                    Draft
                                </span>
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{project.subtitle}</p>
                        <p className="text-gray-600 mb-4 line-clamp-3 flex-1 text-sm">{project.shortDesc}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {(project.tech || []).slice(0, 3).map((t, i) => (
                                <span key={i} className="neo-tag text-xs">{t.name}</span>
                            ))}
                            {(project.tech || []).length > 3 && <span className="text-xs text-gray-400">+{project.tech.length - 3} more</span>}
                        </div>

                        <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-4">
                            <button onClick={() => onEdit(project)} className="text-indigo-600 font-medium hover:text-indigo-800 text-sm">Edit</button>
                            <button onClick={() => onDelete(project._id || project.id)} className="text-red-500 font-medium hover:text-red-700 text-sm">Delete</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ProjectList;
