import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminProjects } from '../../api/projects';
import { useTOTP } from '../context/TOTPContext';

const DashboardPage = () => {
    const [randomProjects, setRandomProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userEmail, logout } = useTOTP();
    const navigate = useNavigate();

    const fetchRandomProjects = async () => {
        setLoading(true);
        try {
            const projects = await getAdminProjects();

            // Shuffle and pick 2
            if (projects && projects.length > 0) {
                const shuffled = [...projects].sort(() => 0.5 - Math.random());
                setRandomProjects(shuffled.slice(0, 2));
            } else {
                setRandomProjects([]);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRandomProjects();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-4 py-3 mb-8 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900 border-none bg-transparent shadow-none tracking-normal">
                                Admin<span className="text-indigo-600">Dashboard</span>
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {userEmail && (
                                <span className="text-sm text-gray-500 hidden sm:inline">{userEmail}</span>
                            )}
                            <Link to="/admin/settings" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Settings">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.59c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.127c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.59c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138.75-.43.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {/* Skills Card */}
                    <Link to="/admin/skills" className="neo-card hover:border-indigo-200 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                        </div>
                        <div className="p-4 relative z-10">
                            <h3 className="text-xl font-bold mb-2 text-gray-900 bg-transparent border-none shadow-none px-0">Manage Skills</h3>
                            <p className="text-gray-600 text-sm mb-4">Add, remove and organize professional skills.</p>
                            <span className="text-indigo-600 font-medium text-sm group-hover:underline">View Skills &rarr;</span>
                        </div>
                    </Link>

                    {/* About Card */}
                    <Link to="/admin/about" className="neo-card hover:border-purple-200 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="p-4 relative z-10">
                            <h3 className="text-xl font-bold mb-2 text-gray-900 bg-transparent border-none shadow-none px-0">Manage About</h3>
                            <p className="text-gray-600 text-sm mb-4">Update experience, research, and achievements.</p>
                            <span className="text-purple-600 font-medium text-sm group-hover:underline">View Details &rarr;</span>
                        </div>
                    </Link>

                    {/* Blog Card */}
                    <Link to="/admin/blog" className="neo-card hover:border-green-200 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" /><path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" /></svg>
                        </div>
                        <div className="p-4 relative z-10">
                            <h3 className="text-xl font-bold mb-2 text-gray-900 bg-transparent border-none shadow-none px-0">Manage Blog</h3>
                            <p className="text-gray-600 text-sm mb-4">Create and manage blog posts with markdown.</p>
                            <span className="text-green-600 font-medium text-sm group-hover:underline">Write Blog &rarr;</span>
                        </div>
                    </Link>

                    {/* Projects Card */}
                    <Link to="/admin/projects" className="neo-card hover:border-blue-200 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                        </div>
                        <div className="p-4 relative z-10">
                            <h3 className="text-xl font-bold mb-2 text-gray-900 bg-transparent border-none shadow-none px-0">Manage Projects</h3>
                            <p className="text-gray-600 text-sm mb-4">Showcase your work and case studies.</p>
                            <span className="text-blue-600 font-medium text-sm group-hover:underline">View Projects &rarr;</span>
                        </div>
                    </Link>
                </div>

                {/* Random Projects Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900 border-none bg-transparent shadow-none px-0">Featured Projects</h2>
                        <button onClick={fetchRandomProjects} className="text-indigo-600 text-sm hover:underline border-none bg-transparent shadow-none">Shuffle</button>
                    </div>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading projects...</div>
                    ) : randomProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {randomProjects.map(project => (
                                <Link key={project._id || project.id} to="/admin/projects" className="neo-card flex flex-col md:flex-row gap-4 hover:shadow-lg transition-shadow">
                                    {project.coverImage && (
                                        <img src={project.coverImage} alt={project.name} className="w-full md:w-32 h-32 object-cover rounded-md" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{project.name}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{project.subtitle}</p>
                                        <p className="text-sm text-gray-600 line-clamp-2">{project.shortDesc}</p>
                                        <div className="mt-3 flex gap-2">
                                            {project.tech && project.tech.slice(0, 3).map((t, i) => (
                                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{typeof t === 'string' ? t : t.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm">No projects found. Add some to see them here!</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
