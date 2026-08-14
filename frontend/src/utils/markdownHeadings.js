import { remark } from 'remark';
import GithubSlugger from 'github-slugger';

const headingText = (node) => {
    return (node.children ?? []).reduce((acc, child) => {
        if (child.type === 'text' || child.type === 'inlineCode') {
            acc += child.value;
        } else if (child.type === 'link' || child.type === 'strong' || child.type === 'emphasis' || child.type === 'delete') {
            acc += headingText(child);
        }
        return acc;
    }, '');
};

export const getMarkdownHeadings = (content) => {
    if (!content) return [];
    const tree = remark().parse(content);
    const slugger = new GithubSlugger();
    const headings = [];

    const walk = (node) => {
        if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
            const text = headingText(node).trim();
            if (text) {
                headings.push({ id: slugger.slug(text), text, depth: node.depth });
            }
        }
        if (node.children) {
            node.children.forEach(walk);
        }
    };

    walk(tree);
    return headings;
};