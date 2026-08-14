import React, { useEffect, useMemo, useState } from 'react';
import { ListOrdered } from 'lucide-react';
import { getMarkdownHeadings } from '../utils/markdownHeadings';

const brutalBox = "border-[3px] border-black bg-white";

const TableOfContents = ({ content, title = 'Contents' }) => {
    const headings = useMemo(() => getMarkdownHeadings(content), [content]);
    const [activeId, setActiveId] = useState(null);

    useEffect(() => {
        if (headings.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-96px 0px -65% 0px', threshold: 0 }
        );
        headings.forEach((h) => {
            const el = document.getElementById(h.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    const renderList = () => (
        <nav aria-label="Table of contents" className="space-y-1 p-2">
            {headings.map((h) => (
                <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block font-bold uppercase tracking-wide py-1.5 pr-2 border-l-4 transition-colors ${
                        h.depth === 3 ? 'pl-5 text-xs text-gray-500' : 'pl-2 text-sm'
                    } ${
                        activeId === h.id
                            ? 'border-black bg-yellow-400 text-black'
                            : 'border-transparent text-gray-700 hover:bg-gray-100 hover:text-black'
                    }`}
                >
                    {h.text}
                </a>
            ))}
        </nav>
    );

    return (
        <>
            {/* Mobile / collapsible */}
            <details className={`lg:hidden my-10 ${brutalBox} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                <summary className="flex items-center gap-2 cursor-pointer font-black uppercase tracking-widest text-sm px-4 py-3 bg-yellow-400 border-b-[3px] border-black select-none">
                    <ListOrdered size={16} /> {title}
                </summary>
                {renderList()}
            </details>

            {/* Desktop / sticky sidebar */}
            <div className={`hidden lg:block ${brutalBox} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                <h2 className="flex items-center gap-2 font-black uppercase tracking-widest text-sm px-4 py-3 bg-yellow-400 border-b-[3px] border-black">
                    <ListOrdered size={16} /> {title}
                </h2>
                {renderList()}
            </div>
        </>
    );
};

export default TableOfContents;