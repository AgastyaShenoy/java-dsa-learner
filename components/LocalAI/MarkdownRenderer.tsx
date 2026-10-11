'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Prism from 'prismjs';

// Import essential language highlighters
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';

import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  let codeBlockCounter = 0;

  return (
    <div className="prose prose-invert prose-xs max-w-none space-y-2 text-xs leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code block highlighting & inline code
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const rawCode = String(children).replace(/\n$/, '');
            const isInline = !match && !rawCode.includes('\n');

            if (isInline) {
              return (
                <code
                  className="bg-zinc-900/90 text-zinc-200 px-1.5 py-0.5 rounded font-mono text-[11px] border border-zinc-800"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const currentIdx = codeBlockCounter++;
            const lang = match ? match[1].toLowerCase() : 'java';
            const grammar = Prism.languages[lang] || Prism.languages.java || Prism.languages.clike;
            
            let highlightedHtml = '';
            try {
              highlightedHtml = Prism.highlight(rawCode, grammar, lang);
            } catch {
              highlightedHtml = rawCode;
            }

            return (
              <div className="my-2.5 rounded-lg bg-[#000000] border border-zinc-800 overflow-hidden font-mono text-xs shadow-md">
                {/* Code Block Header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#09090b] border-b border-zinc-800 text-[11px] text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                    {match ? match[1] : 'java'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(rawCode, currentIdx)}
                    className="hover:text-white flex items-center space-x-1 transition text-[11px]"
                  >
                    {copiedIndex === currentIdx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Highlighted Code Output */}
                <pre className="p-3.5 overflow-x-auto text-zinc-200 leading-normal font-mono text-[11.5px] no-scrollbar">
                  <code
                    className={`language-${lang}`}
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                  />
                </pre>
              </div>
            );
          },

          // Paragraph styling
          p({ children }) {
            return <p className="mb-2 last:mb-0 leading-relaxed text-zinc-200">{children}</p>;
          },

          // Headings
          h1({ children }) {
            return <h1 className="text-sm font-bold text-white mt-3 mb-1.5 pb-1 border-b border-zinc-800">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xs font-bold text-white mt-2.5 mb-1">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-xs font-semibold text-zinc-200 mt-2 mb-1">{children}</h3>;
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-1.5 text-zinc-300 pl-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-1.5 text-zinc-300 pl-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-zinc-700 bg-zinc-950/60 rounded-r px-3 py-1.5 my-2 text-zinc-300 italic">
                {children}
              </blockquote>
            );
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2 rounded border border-zinc-800">
                <table className="w-full text-left text-xs border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-zinc-900 px-2.5 py-1.5 border-b border-zinc-800 font-semibold text-white text-[11px]">{children}</th>;
          },
          td({ children }) {
            return <td className="px-2.5 py-1.5 border-b border-zinc-800/60 text-zinc-300 text-[11px]">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Streaming blinking cursor */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-zinc-300 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
};
