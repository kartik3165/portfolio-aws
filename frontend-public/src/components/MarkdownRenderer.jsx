import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X } from 'lucide-react';
import CodeBlock from './CodeBlock';

const MarkdownRenderer = ({ content }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const brutalBorder = "border-[3px] md:border-[4px] border-black";
    const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

    const MarkdownComponents = {
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
        code: CodeBlock,
        img: ({ node, ...props }) => (
            <div
                className={`my-10 ${brutalBorder} ${brutalShadow} cursor-pointer hover:scale-[1.01] transition-transform`}
                onClick={() => setSelectedImage(props.src)}
            >
                <img className="w-full h-auto object-cover" {...props} />
            </div>
        ),
        a: ({ node, ...props }) => <a className="text-blue-600 underline decoration-2 font-bold hover:text-black hover:bg-yellow-400 transition-colors" {...props} />,
        table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-8">
                <table className="w-full border-[3px] border-black border-collapse text-left" {...props} />
            </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-yellow-400 border-b-[3px] border-black" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="bg-white" {...props} />,
        tr: ({ node, ...props }) => <tr className="border-b-[3px] border-black last:border-b-0 hover:bg-gray-50 transition-colors" {...props} />,
        th: ({ node, ...props }) => <th className="p-4 font-black uppercase text-lg border-r-[3px] border-black last:border-r-0 whitespace-nowrap" {...props} />,
        td: ({ node, ...props }) => <td className="p-4 font-medium border-r-[3px] border-black last:border-r-0" {...props} />,
    };

    return (
        <>
            <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>

            {/* Full Screen Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8 cursor-pointer backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 text-white hover:text-yellow-400 transition-colors bg-black/50 p-2 rounded-full pointer-events-auto"
                    >
                        <X size={32} strokeWidth={3} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full Screen View"
                        className="max-w-full max-h-[90vh] object-contain border-4 border-white shadow-2xl pointer-events-none"
                    />
                </div>
            )}
        </>
    );
};

export default MarkdownRenderer;
