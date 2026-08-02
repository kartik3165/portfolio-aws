import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SkillsPage from './pages/SkillsPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import ProjectsPage from './pages/ProjectsPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import { TOTPProvider, useTOTP } from './context/TOTPContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, booting } = useTOTP();

    if (booting) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <TOTPProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/skill" element={
                        <ProtectedRoute>
                            <SkillsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/about" element={
                        <ProtectedRoute>
                            <AboutPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/blog" element={
                        <ProtectedRoute>
                            <BlogPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/projects" element={
                        <ProtectedRoute>
                            <ProjectsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <AdminSettingsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </TOTPProvider>
    );
}

export default App;
