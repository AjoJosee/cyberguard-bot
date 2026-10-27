import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

export function MarkdownView({ content }: MarkdownViewProps) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm md:text-base leading-relaxed break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Horizontal rule
        if (trimmed === '---') {
          return <hr key={idx} className="my-3 border-slate-700/60" />;
        }

        // H3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base md:text-lg font-bold text-slate-100 mt-2 mb-1 flex items-center gap-1.5">
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }

        // H4
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-sm md:text-base font-semibold text-emerald-400 mt-2 mb-1">
              {renderInline(trimmed.slice(5))}
            </h4>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="border-l-4 border-amber-500/80 bg-amber-950/20 px-3 py-2 rounded-r text-amber-200/90 text-sm italic my-2"
            >
              {renderInline(trimmed.slice(2))}
            </div>
          );
        }

        // Numbered list item: e.g. "1. " or "10. "
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1 my-1">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 flex items-center justify-center mt-0.5">
                {numMatch[1]}
              </span>
              <div className="flex-1 text-slate-200">
                {renderInline(numMatch[2])}
              </div>
            </div>
          );
        }

        // Bullet item: "- " or "* "
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
              <div className="flex-1 text-slate-200">
                {renderInline(trimmed.slice(2))}
              </div>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-slate-200">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Regex to match markdown links: [label](url), bold: **bold**, and code: `code`
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before match
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Link: [label](url)
      const label = match[1];
      const url = match[2];
      elements.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
        >
          {label}
          <ExternalLink className="w-3 h-3 inline opacity-80" />
        </a>
      );
    } else if (match[3]) {
      // Bold: **text**
      elements.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-white">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // Code: `code`
      elements.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-xs border border-slate-700"
        >
          {match[4]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : text;
}
