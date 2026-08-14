import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkGithubBlockquoteAlert from 'remark-github-blockquote-alert';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import githubDark from '@shikijs/themes/github-dark';

export const remarkPlugins = [
    remarkGfm,
    remarkMath,
    remarkBreaks,
    remarkGithubBlockquoteAlert,
];

export const rehypePlugins = [
    [
        rehypePrettyCode,
        {
            theme: githubDark,
            keepBackground: false,
            defaultLang: 'text',
            filterMetaString: (string) => string.replace(/\bln\b/, 'showLineNumbers'),
        },
    ],
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: 'append', properties: { className: ['anchor-link'] } }],
    rehypeKatex,
];