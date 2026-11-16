'use client';

import React, { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-json';
import 'katex/dist/katex.min.css';
import { Check, Copy } from 'lucide-react';

/** Models often emit \( \) and \[ \]; remark-math only understands $ and $$. */
function normaliseMath(md: string): string {
  return md
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n$$${m}$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m}$`);
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const grammar = Prism.languages[lang] ?? Prism.languages.java;
  // Prism escapes the code, so this HTML is safe.
  const html = Prism.highlight(code, grammar, lang);
  return (
    <div className="my-2 rounded bg-paper-0 border border-line overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 border-b border-line text-[10px] font-mono uppercase text-ink-2">
        <span>{lang}</span>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-ink normal-case"
          onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        >
          {copied ? <><Check className="w-3 h-3 text-ink-green" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] leading-normal font-mono text-ink"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  );
}

const components: Components = {
  // Block code arrives as <pre><code class="language-x">; render it ourselves and drop the outer <pre>.
  pre({ children }) {
    const child = React.Children.only(children) as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
    const lang = /language-(\w+)/.exec(child.props.className ?? '')?.[1]?.toLowerCase() ?? 'java';
    return <CodeBlock code={String(child.props.children ?? '').replace(/\n$/, '')} lang={lang} />;
  },
  code({ children }) {
    return <code className="bg-paper-2 text-ink px-1 py-0.5 rounded font-mono text-[12px] border border-line">{children}</code>;
  },
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="text-sm font-semibold text-ink mt-3 mb-1">{children}</h3>,
  h2: ({ children }) => <h3 className="text-sm font-semibold text-ink mt-3 mb-1">{children}</h3>,
  h3: ({ children }) => <h4 className="text-sm font-semibold text-ink mt-2 mb-1">{children}</h4>,
  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-line pl-3 my-2 text-ink-2">{children}</blockquote>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-ink">{children}</a>,
  table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse">{children}</table></div>,
  th: ({ children }) => <th className="border border-line px-2 py-1 text-left text-ink">{children}</th>,
  td: ({ children }) => <td className="border border-line px-2 py-1 text-ink">{children}</td>,
};

/** Memoised: a finished message is parsed once, not on every keystroke or streamed token. */
export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-ink break-words">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {normaliseMath(content)}
      </ReactMarkdown>
    </div>
  );
});
