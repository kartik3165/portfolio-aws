import React from 'react';

const brutalBorder = "border-[3px] border-black";
const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]";

const CodeBlock = ({ children, className, ...props }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-8">
            <pre className="bg-black text-white p-6 rounded-none overflow-x-auto border-[3px] border-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                <code className={`font-mono text-sm ${className}`} {...props}>
                    {children}
                </code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Copy code"
            >
                {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export const MarkdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-3xl md:text-5xl font-black uppercase mb-6 mt-10" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-2xl md:text-4xl font-black uppercase mb-5 mt-10 border-b-4 border-yellow-400 inline-block pr-4" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-xl md:text-2xl font-black uppercase mb-4 mt-8" {...props} />,
    p: ({ node, ...props }) => <p className="text-lg md:text-xl font-medium leading-relaxed mb-6" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-lg font-medium" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-lg font-medium" {...props} />,
    li: ({ node, ...props }) => <li className="pl-2" {...props} />,
    blockquote: ({ node, ...props }) => (
        <blockquote className="border-l-[6px] border-black bg-gray-100 p-6 my-8 italic text-xl font-bold" {...props} />
    ),
    code: ({ node, inline, className, children, ...props }) => {
        if (inline) {
            return (
                <code className="bg-yellow-200 px-1 py-0.5 rounded font-mono text-sm font-bold border border-black" {...props}>
                    {children}
                </code>
            );
        }

        return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
    },
    img: ({ node, ...props }) => (
        <div className={`my-10 ${brutalBorder} ${brutalShadow}`}>
            <img className="w-full h-auto object-cover" {...props} />
        </div>
    ),
    a: ({ node, ...props }) => <a className="text-blue-600 underline decoration-2 font-bold hover:text-black hover:bg-yellow-400 transition-colors" {...props} />,
    table: ({ node, ...props }) => <div className="overflow-x-auto my-8"><table className="min-w-full border-collapse border-[3px] border-black text-left" {...props} /></div>,
    thead: ({ node, ...props }) => <thead className="bg-gray-100 border-b-[3px] border-black" {...props} />,
    tbody: ({ node, ...props }) => <tbody className="divide-y-2 divide-black" {...props} />,
    tr: ({ node, ...props }) => <tr className="hover:bg-yellow-50 transition-colors" {...props} />,
    th: ({ node, ...props }) => <th className="p-4 font-black uppercase text-sm tracking-wide border-r-[3px] border-black last:border-r-0" {...props} />,
    td: ({ node, ...props }) => <td className="p-4 font-medium border-r-[3px] border-black last:border-r-0" {...props} />,
};
