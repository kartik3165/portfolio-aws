import React, { createContext, use, useMemo, useRef, useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import { MarkdownHooks } from 'react-markdown';
import { remarkPlugins, rehypePlugins } from '../utils/markdownPlugins';

const brutalBorder = "border-[3px] md:border-[4px] border-black";
const brutalShadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

const BlockCodeContext = createContext(false);
const AlertContext = createContext(false);
const CodeFigureContext = createContext(false);

const CodeBlock = ({ language = '', children }) => {
    const [copied, setCopied] = useState(false);
    const preRef = useRef(null);
    const inCodeFigure = use(CodeFigureContext);

    const handleCopy = async () => {
        const text = (preRef.current?.textContent ?? '').replace(/\n$/, '');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className={`relative group ${inCodeFigure ? 'mb-6' : 'my-6'} ${brutalBorder} ${brutalShadow} overflow-hidden bg-black`}>
            <div className="flex items-center justify-between bg-black px-4 py-1.5 border-b border-white/20">
                <span className="flex items-center gap-2 text-white/90 font-mono text-xs uppercase tracking-widest">
                    <FileCode2 size={14} className="text-yellow-400 shrink-0" />
                    {language || 'code'}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy code"
                    title="Copy code"
                    className="p-1.5 bg-white/10 text-white rounded hover:bg-yellow-400 hover:text-black transition-colors focus-visible:outline-2 focus-visible:outline-yellow-400"
                >
                    {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                </button>
            </div>
            <div ref={preRef} className="overflow-x-auto p-4 text-sm leading-relaxed">
                {children}
            </div>
        </div>
    );
};

export const Figure = ({ src, alt, onLightbox }) => (
    <figure
        className={`my-8 ${brutalBorder} ${brutalShadow} cursor-pointer hover:scale-[1.005] transition-transform`}
        onClick={() => onLightbox?.(src, alt)}
    >
        <img
            src={src}
            alt={alt || ''}
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-cover"
        />
        {alt && (
            <figcaption className="bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide text-gray-700 border-t-2 border-black">
                {alt}
            </figcaption>
        )}
    </figure>
);

const parseVideoUrl = (url) => {
    if (!url) return null;
    const input = String(url).trim();
    let match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/))([\w-]{11})/);
    if (match) return { type: 'youtube', id: match[1] };
    match = input.match(/vimeo\.com\/(\d+)/);
    if (match) return { type: 'vimeo', id: match[1] };
    return null;
};

export const VideoEmbed = ({ type, id, title = '' }) => (
    <div className={`relative w-full my-8 ${brutalBorder} ${brutalShadow} bg-black`} style={{ aspectRatio: '16 / 9' }}>
        {type === 'youtube' ? (
            <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                title={title || 'YouTube video'}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        ) : (
            <iframe
                className="w-full h-full"
                src={`https://player.vimeo.com/video/${id}`}
                title={title || 'Vimeo video'}
                loading="lazy"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
            />
        )}
    </div>
);

export const PrettyCodeTitle = ({ children, ...props }) => (
    <figcaption
        {...props}
        className="flex items-center gap-2 bg-black px-4 py-1.5 border-b border-white/20 font-mono text-xs uppercase tracking-widest text-white/80"
    >
        <FileCode2 size={14} className="text-yellow-400 shrink-0" />
        {children}
    </figcaption>
);

const isCodeFigure = (props) =>
    props['data-rehype-pretty-code-figure'] !== undefined || props['dataRehypePrettyCodeFigure'] !== undefined;

const MarkdownParagraph = (props) => {
    const inAlert = use(AlertContext);
    const isAlertTitle = typeof props.className === 'string' && props.className.includes('markdown-alert-title');
    if (isAlertTitle) return <p {...props} />;
    return (
        <p
            {...props}
            className={inAlert ? 'text-lg leading-relaxed mb-2' : 'text-lg md:text-xl leading-relaxed mb-5'}
        />
    );
};

const MarkdownUnorderedList = ({ className, children, ...props }) => {
    const isTaskList = typeof className === 'string' && className.includes('contains-task-list');
    return (
        <ul
            {...props}
            className={
                isTaskList
                    ? `${className} list-none pl-0 mb-5 space-y-2.5 text-lg font-medium`
                    : 'list-disc pl-6 mb-5 space-y-1.5 text-lg font-medium'
            }
        >
            {children}
        </ul>
    );
};

const MarkdownListItem = ({ className, children, ...props }) => {
    const isTaskItem = typeof className === 'string' && className.includes('task-list-item');
    return (
        <li
            {...props}
            className={isTaskItem ? `${className} list-none flex items-start gap-3` : 'pl-2'}
        >
            {children}
        </li>
    );
};

const MarkdownInput = (props) =>
    props.type === 'checkbox' ? (
        <input
            type="checkbox"
            defaultChecked={props.checked}
            className="w-5 h-5 shrink-0 mt-1 cursor-pointer accent-black border-[3px] border-black focus-visible:outline-2 focus-visible:outline-yellow-400"
        />
    ) : (
        <input {...props} />
    );

const MarkdownDiv = ({ className, children, ...props }) => {
    const isAlert = typeof className === 'string' && className.includes('markdown-alert');
    if (isAlert) {
        return (
            <AlertContext.Provider value={true}>
                <div className={className} {...props}>{children}</div>
            </AlertContext.Provider>
        );
    }
    return <div className={className} {...props}>{children}</div>;
};

const MarkdownFigure = ({ children, ...props }) => {
    if (isCodeFigure(props)) {
        const hasCaption = React.Children.toArray(children).some(
            (c) => React.isValidElement(c) && c.type === PrettyCodeTitle
        );
        return (
            <CodeFigureContext.Provider value={hasCaption}>
                {children}
            </CodeFigureContext.Provider>
        );
    }
    return <figure {...props}>{children}</figure>;
};

const nodeText = (node) =>
    (node?.children ?? [])
        .map((c) => (c.type === 'text' ? c.value : c.type === 'element' ? nodeText(c) : ''))
        .join('');

const createMarkdownComponents = ({ onLightbox } = {}) => ({
    h1: (props) => <h1 className="scroll-mt-32 text-2xl md:text-4xl font-black uppercase mb-4 mt-8 leading-tight" {...props} />,
    h2: (props) => <h2 className="scroll-mt-32 text-xl md:text-3xl font-black uppercase mb-3 mt-8 border-b-2 border-black pb-1 inline-block pr-2" {...props} />,
    h3: (props) => <h3 className="scroll-mt-32 text-lg md:text-2xl font-bold uppercase mb-2 mt-6" {...props} />,
    h4: (props) => <h4 className="scroll-mt-32 text-base md:text-lg font-bold uppercase mb-2 mt-5" {...props} />,
    p: MarkdownParagraph,
    ul: MarkdownUnorderedList,
    ol: (props) => <ol className="list-decimal pl-6 mb-5 space-y-1.5 text-lg font-medium" {...props} />,
    li: MarkdownListItem,
    input: MarkdownInput,
    hr: (props) => <hr className="my-8 border-t-2 border-gray-300" {...props} />,
    blockquote: (props) => (
        <blockquote className="border-l-4 border-gray-400 bg-gray-50 p-5 my-6 italic text-lg font-medium text-gray-700" {...props} />
    ),
    del: (props) => <del className="opacity-70 decoration-2" {...props} />,
    div: MarkdownDiv,
    figure: MarkdownFigure,
    figcaption: (props) => <PrettyCodeTitle {...props} />,
    pre: ({ children, ...props }) => (
        <BlockCodeContext.Provider value={true}>
            <CodeBlock language={props['data-language']}>{children}</CodeBlock>
        </BlockCodeContext.Provider>
    ),
    code: ({ children, ...props }) => (
        <BlockCodeContext.Consumer>
            {(isBlock) =>
                isBlock ? (
                    <code {...props}>{children}</code>
                ) : (
                    <code className="bg-yellow-200 px-1.5 py-0.5 rounded font-mono text-[0.85em] font-bold text-black border border-black">
                        {children}
                    </code>
                )
            }
        </BlockCodeContext.Consumer>
    ),
    img: ({ src, alt }) => <Figure src={src} alt={alt} onLightbox={onLightbox} />,
    a: ({ node, href, children, ...props }) => {
        const text = nodeText(node).trim();
        const video = parseVideoUrl(href);
        if (video && text === href) {
            return <VideoEmbed type={video.type} id={video.id} title={text} />;
        }
        return <a className="text-blue-600 underline decoration-2 font-bold hover:text-black hover:bg-yellow-400 transition-colors" href={href} {...props}>{children}</a>;
    },
    table: ({ children, ...props }) => (
        <div className="overflow-x-auto my-6">
            <table className="w-full border-2 border-black border-collapse text-left" {...props}>{children}</table>
        </div>
    ),
    thead: (props) => <thead className="bg-gray-100 border-b-2 border-black" {...props} />,
    tbody: (props) => <tbody className="bg-white" {...props} />,
    tr: (props) => <tr className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors" {...props} />,
    th: (props) => <th className="p-3 font-bold uppercase text-sm border-r border-gray-200 last:border-r-0 whitespace-nowrap" {...props} />,
    td: (props) => <td className="p-3 font-medium border-r border-gray-200 last:border-r-0" {...props} />,
});

class MarkdownErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error('Markdown rendering failed:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="my-8 border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-black uppercase tracking-widest text-sm mb-4">
                        Content failed to render, showing raw text
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">{this.props.content}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export const MarkdownContent = ({ content, onLightbox }) => {
    const components = useMemo(() => createMarkdownComponents({ onLightbox }), [onLightbox]);
    return (
        <MarkdownErrorBoundary content={content}>
            <MarkdownHooks
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={components}
            fallback={
                <div className="py-8 space-y-3" aria-hidden="true">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
            }
        >
            {content}
        </MarkdownHooks>
        </MarkdownErrorBoundary>
    );
};