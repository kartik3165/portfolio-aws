import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const useScrollTracking = () => {
    const location = useLocation();

    useEffect(() => {
        let sent = {
            25: false,
            50: false,
            75: false,
            100: false
        };

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const height =
                document.documentElement.scrollHeight - window.innerHeight;

            const percent = Math.round((scrollTop / height) * 100);

            [25, 50, 75, 100].forEach((p) => {
                if (percent >= p && !sent[p]) {
                    sent[p] = true;

                    if (window.gtag) {
                        window.gtag("event", "scroll_depth", {
                            depth: `${p}%`,
                            page_path: location.pathname
                        });
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [location]);
};

export default useScrollTracking;