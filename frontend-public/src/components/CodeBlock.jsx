import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

const CodeBlock = ({ inline, className, children, ...props }) => {
    const [copied, setCopied] = useState(false);

    if (inline) {
        return (
            <code className="bg-yellow-200 px-1 py-0.5 rounded font-mono text-sm font-bold border border-black" {...props}>
                {children}
            </code>
        );
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-8">
            <pre className="bg-black text-white p-6 rounded-none overflow-x-auto border-[3px] border-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                <code className="font-mono text-sm" {...props}>
                    {children}
                </code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors border border-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Copy code"
                title="Copy code"
            >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
        </div>
    );
};

export default CodeBlock;
