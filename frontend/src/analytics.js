import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = import.meta.env.VITE_GA_ID;

const Analytics = () => {
    const location = useLocation();

    useEffect(() => {
        if (!GA_ID || !window.gtag) return;

        const path = location.pathname;

        // Page view
        window.gtag("config", GA_ID, {
            page_path: path,
            page_title: document.title
        });

        // Blog tracking
        if (path.startsWith("/blog/")) {
            const slug = path.split("/blog/")[1];
            window.gtag("event", "blog_view", {
                blog_slug: slug
            });
        }

        // Project tracking
        if (path.startsWith("/project/")) {
            const slug = path.split("/project/")[1];
            window.gtag("event", "project_view", {
                project_slug: slug
            });
        }

    }, [location]);

    return null;
};

export default Analytics;