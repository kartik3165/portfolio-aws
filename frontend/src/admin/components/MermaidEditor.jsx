import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import MermaidDiagram from '../../components/MermaidDiagram';
import { Sun, Moon, Maximize, Minimize, AlertTriangle, Trash2, Wand2, ChevronDown } from 'lucide-react';

const TEMPLATES = {
    flowchart: `flowchart TD
    A[Client] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[Business Logic]
    D --> E[(Database)]
    D --> F[Redis Cache]`,
    sequence: `sequenceDiagram
    participant U as User
    participant API as API
    participant DB as Database
    U->>API: POST /order
    API->>DB: Insert order
    DB-->>API: 201 Created
    API-->>U: Order confirmed`,
    state: `stateDiagram-v2
    [*] --> Pending
    Pending --> Processing: payment received
    Processing --> Completed
    Completed --> [*]`,
    er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER {
        string name
        string email
    }`,
    gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Backend
    API : 2026-01-01, 14d
    section Frontend
    UI : 2026-01-08, 10d`
};

const MermaidEditor = ({ label = 'System Architecture (Mermaid)', value = '', onChange }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [error, setError] = useState('');
    const templateRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isFullscreen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (templateRef.current && !templateRef.current.contains(e.target)) {
                setShowTemplates(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!value.trim()) {
                if (!cancelled) setError('');
                return;
            }

            try {
                mermaid.initialize({ startOnLoad: false, theme: isDarkMode ? 'dark' : 'default', securityLevel: 'strict' });
                await mermaid.parse(value);
                if (!cancelled) setError('');
            } catch (err) {
                if (!cancelled) setError(err?.message || 'Invalid mermaid syntax');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [value, isDarkMode]);

    const insertTemplate = (code) => {
        onChange(code);
        setShowTemplates(false);
    };

    const iconBtn = `p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : ''} transition-all duration-300`}>
            <div className={`${isFullscreen ? 'h-screen' : ''} ${isDarkMode ? 'bg-gray-900' : ''}`}>
                {/* Control Bar */}
                <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {isFullscreen ? 'Fullscreen Mermaid Editor' : label}
                        </span>
                        {error && <span className="hidden md:inline text-xs font-bold text-red-500 uppercase tracking-wide">Syntax Error</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Template Dropdown */}
                        <div className="relative" ref={templateRef}>
                            <button
                                type="button"
                                onClick={() => setShowTemplates(v => !v)}
                                className={`flex items-center gap-1 p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                title="Insert template"
                            >
                                <Wand2 size={16} /> <span className="hidden sm:inline text-sm font-medium">Template</span> <ChevronDown size={14} />
                            </button>
                            {showTemplates && (
                                <div className={`absolute right-0 mt-1 z-20 rounded-lg border shadow-lg py-1 min-w-[160px] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    {Object.entries(TEMPLATES).map(([name, code]) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => insertTemplate(code)}
                                            className={`block w-full text-left px-3 py-2 text-sm capitalize transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Clear */}
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className={iconBtn}
                                title="Clear diagram"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        {/* Dark Mode Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsDarkMode(v => !v)}
                            className={iconBtn}
                            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(v => !v)}
                            className={iconBtn}
                            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className={`flex items-start gap-2 px-4 py-2 border-b text-red-700 text-sm font-medium ${isDarkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'}`}>
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span className={`font-mono text-xs whitespace-pre-wrap ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
                    </div>
                )}

                {/* Split Editor / Preview */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isFullscreen ? 'h-[calc(100vh-5rem)] p-6' : 'h-[520px] border-t border-gray-200 pt-6'}`}>
                    {/* Code Editor */}
                    <div className="flex flex-col h-full">
                        <label className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Mermaid Code</label>
                        <textarea
                            name="architectureMermaid"
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            spellCheck="false"
                            className={`flex-1 font-mono text-sm p-4 resize-none focus:ring-2 focus:ring-indigo-500 rounded-lg border ${isDarkMode
                                ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
                                : 'neo-input'
                                }`}
                            placeholder={'flowchart TD\n    A[Client] --> B[API]\n    B --> C[(Database)]'}
                        />
                    </div>

                    {/* Live Preview */}
                    <div className={`flex flex-col h-full rounded-lg border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <label className={`text-sm font-bold p-2 border-b block ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                            Live Preview
                        </label>
                        <div className={`flex-1 overflow-auto p-4 ${isDarkMode ? '!bg-gray-800' : '!bg-gray-50'}`}>
                            {value.trim() ? (
                                <MermaidDiagram chart={value} theme={isDarkMode ? 'dark' : 'default'} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                                    Preview will appear here
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MermaidEditor;
