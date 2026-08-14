import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const MermaidDiagram = ({ chart, theme = 'default' }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!chart) return;
        let cancelled = false;
        let cleanupBind = null;

        (async () => {
            try {
                mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'strict' });
                const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
                const { svg, bindFunctions } = await mermaid.render(id, chart);
                if (cancelled) return;
                containerRef.current.innerHTML = svg;
                if (bindFunctions) cleanupBind = bindFunctions(containerRef.current);
            } catch (err) {
                if (!cancelled) {
                    containerRef.current.textContent = `Failed to render diagram: ${err.message}`;
                }
            }
        })();

        return () => {
            cancelled = true;
            if (cleanupBind) cleanupBind();
        };
    }, [chart, theme]);

    return <div ref={containerRef} className="flex justify-center overflow-x-auto" />;
};

export default MermaidDiagram;