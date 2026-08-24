import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Analytics from './analytics';
import { TOTPProvider, useTOTP } from './admin/context/TOTPContext';

const GA_ID = import.meta.env.VITE_GA_ID;

const Home = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const LoginPage = lazy(() => import('./admin/pages/LoginPage'));
const DashboardPage = lazy(() => import('./admin/pages/DashboardPage'));
const AdminSkillsPage = lazy(() => import('./admin/pages/SkillsPage'));
const AdminAboutPage = lazy(() => import('./admin/pages/AboutPage'));
const AdminBlogPage = lazy(() => import('./admin/pages/BlogPage'));
const AdminProjectsPage = lazy(() => import('./admin/pages/ProjectsPage'));
const AdminSettingsPage = lazy(() => import('./admin/pages/AdminSettingsPage'));

const PageFallback = ({ fullScreen = false }) => (
  <div className={`${fullScreen ? 'min-h-screen' : 'min-h-[40vh]'} flex items-center justify-center px-4`}>
    <div className="border-[3px] border-black bg-yellow-400 px-5 py-3 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      Loading...
    </div>
  </div>
);

const renderLazyPage = (PageComponent, { fullScreen = false } = {}) => (
  <Suspense fallback={<PageFallback fullScreen={fullScreen} />}>
    <PageComponent />
  </Suspense>
);

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const AdminAuthLayout = () => (
  <TOTPProvider>
    <Outlet />
  </TOTPProvider>
);

const ProtectedAdminRoute = () => {
  const { isAuthenticated, booting } = useTOTP();

  if (booting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

const App = () => {
  useEffect(() => {
    if (!GA_ID || typeof document === 'undefined') return;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`)) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }, []);
  return (
    <BrowserRouter>
      <Analytics />
      <div className="min-h-screen bg-[#fafafa] font-sans text-black selection:bg-yellow-400 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<PublicLayout>{renderLazyPage(Home)}</PublicLayout>} />
          <Route path="/about" element={renderLazyPage(AboutPage)} />
          <Route path="/project" element={renderLazyPage(ProjectsPage)} />
          <Route path="/project/:id" element={renderLazyPage(ProjectDetailPage)} />
          <Route path="/blog" element={renderLazyPage(BlogPage)} />
          <Route path="/blog/:slug" element={renderLazyPage(BlogPostPage)} />

          <Route path="/admin" element={<AdminAuthLayout />}>
            <Route path="login" element={renderLazyPage(LoginPage, { fullScreen: true })} />
            <Route element={<ProtectedAdminRoute />}>
              <Route index element={renderLazyPage(DashboardPage, { fullScreen: true })} />
              <Route path="skills" element={renderLazyPage(AdminSkillsPage, { fullScreen: true })} />
              <Route path="about" element={renderLazyPage(AdminAboutPage, { fullScreen: true })} />
              <Route path="blog" element={renderLazyPage(AdminBlogPage, { fullScreen: true })} />
              <Route path="projects" element={renderLazyPage(AdminProjectsPage, { fullScreen: true })} />
              <Route path="settings" element={renderLazyPage(AdminSettingsPage, { fullScreen: true })} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
