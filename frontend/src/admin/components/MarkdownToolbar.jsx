import React from 'react';

const SNIPPETS = {
    h1: '# Heading 1',
    h2: '## Heading 2',
    h3: '### Heading 3',
    bold: '**Bold Text**',
    italic: '*Italic Text*',
    blockquote: '> This is a blockquote.\n> It can span multiple lines.',
    ul: '- Item 1\n- Item 2\n- Item 3',
    ol: '1. First step\n2. Second step\n3. Third step',
    link: '[Link Text](https://example.com)',
    image: '![Alt Text](https://example.com/image.jpg)',
    code: '`inline code`',
    codeblock: '```javascript\n// Code block\nconsole.log("Hello");\n```',
    codeblockLn: '```javascript ln\n// Code block with line numbers\nfor (let i = 0; i < 10; i++) {\n    console.log(i);\n}\n```',
    calloutNote: '> [!NOTE]\n> Useful information that users should know.\n',
    calloutTip: '> [!TIP]\n> Helpful advice for going further.\n',
    calloutWarning: '> [!WARNING]\n> Something that needs urgent attention.\n',
    mathInline: 'Inline math: $E = mc^2$',
    mathBlock: '$$\nE = mc^2\n$$\n',
    video: 'https://youtu.be/YOUR_VIDEO_ID',
    table: '| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |',
    hr: '---',
    full: `# Sample Markdown Document

## Introduction
This is a **sample Markdown file** to demonstrate basic formatting.

Markdown is:
- Easy to read
- Easy to write
- Widely supported

---

## Text Formatting
- *Italic text*
- **Bold text**
- ***Bold and italic***
- ~~Strikethrough~~

> This is a blockquote.  
> It can span multiple lines.

---

## Lists

### Unordered List
- Apples
- Bananas
  - Ripe
  - Unripe
- Oranges

### Ordered List
1. First step
2. Second step
3. Third step

---

## Links and Images
[Visit OpenAI](https://openai.com)

![Sample Image](https://img.reportgenai.in/blog/019c0ad0-7ecb-7534-8841-001f47736a1a.webp)

---

## Code

### Inline Code
Use \`console.log()\` to print output.

### Code Block
\`\`\`python
def greet(name):
    print(f"Hello, {name}!")

greet("World")
\`\`\`

---

## Tables

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`
};

const MarkdownToolbar = () => {
    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        // You might want a toast here, but simple alert or nothing is fine for now
        // alert(`Copied ${label} to clipboard!`); 
    };

    const ToolButton = ({ label, snippetKey, title }) => (
        <button
            type="button"
            onClick={() => copyToClipboard(SNIPPETS[snippetKey], title || label)}
            className="px-2 py-1 text-xs font-mono border border-gray-300 rounded bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title={title || `Copy ${label} syntax`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
            <span className="text-xs font-bold text-gray-500 flex items-center mr-2">Helpers:</span>
            <ToolButton label="H1" snippetKey="h1" />
            <ToolButton label="H2" snippetKey="h2" />
            <ToolButton label="H3" snippetKey="h3" />
            <div className="w-px bg-gray-300 mx-1"></div>
            <ToolButton label="B" snippetKey="bold" title="Bold" />
            <ToolButton label="I" snippetKey="italic" title="Italic" />
            <ToolButton label="Quote" snippetKey="blockquote" />
            <div className="w-px bg-gray-300 mx-1"></div>
            <ToolButton label="List" snippetKey="ul" title="Unordered List" />
            <ToolButton label="Num" snippetKey="ol" title="Ordered List" />
            <div className="w-px bg-gray-300 mx-1"></div>
            <ToolButton label="Link" snippetKey="link" />
            <ToolButton label="Img" snippetKey="image" />
            <ToolButton label="Table" snippetKey="table" />
            <div className="w-px bg-gray-300 mx-1"></div>
            <ToolButton label="Code" snippetKey="code" title="Inline Code" />
            <ToolButton label="{ }" snippetKey="codeblock" title="Code Block" />
            <ToolButton label="{ }+n" snippetKey="codeblockLn" title="Code Block with Line Numbers" />
            <ToolButton label="---" snippetKey="hr" title="Horizontal Rule" />
            <div className="w-px bg-gray-300 mx-1"></div>
            <ToolButton label="Note" snippetKey="calloutNote" title="Note Callout" />
            <ToolButton label="Tip" snippetKey="calloutTip" title="Tip Callout" />
            <ToolButton label="Warn" snippetKey="calloutWarning" title="Warning Callout" />
            <ToolButton label="$x$" snippetKey="mathInline" title="Inline Math" />
            <ToolButton label="$$" snippetKey="mathBlock" title="Math Block" />
            <ToolButton label="Video" snippetKey="video" title="YouTube / Vimeo Embed" />
            <div className="flex-1"></div>
            <ToolButton label="Full Template" snippetKey="full" title="Copy Full Sample Document" />
        </div>
    );
};

export default MarkdownToolbar;
