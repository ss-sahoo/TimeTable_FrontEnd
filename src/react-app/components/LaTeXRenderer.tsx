import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXRendererProps {
  content: string;
  className?: string;
}

// Helper function to detect and render image URLs in text
function renderTextWithImages(text: string, key: number) {
  // Regex to detect image URLs (common image hosting services and extensions)
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|svg|webp|bmp)(?:\?[^\s]*)?)/gi;

  // Also match mathpix CDN URLs and other common image URLs
  const urlRegex = /(https?:\/\/(?:cdn\.mathpix\.com|i\.imgur\.com|media\.geeksforgeeks\.org)[^\s]+)/gi;

  const parts: Array<{ type: 'text' | 'image'; content: string }> = [];
  let lastIndex = 0;

  // Combine both regex patterns
  const combinedRegex = new RegExp(
    `(${imageUrlRegex.source}|${urlRegex.source})`,
    'gi'
  );

  let match;
  const tempText = text;
  const matches: Array<{ index: number; url: string }> = [];

  // Find all image URLs
  combinedRegex.lastIndex = 0;
  while ((match = combinedRegex.exec(tempText)) !== null) {
    matches.push({ index: match.index, url: match[0] });
  }

  // Build parts array
  matches.forEach((m, i) => {
    // Add text before this image
    if (m.index > lastIndex) {
      parts.push({ type: 'text', content: tempText.substring(lastIndex, m.index) });
    }
    // Add the image
    parts.push({ type: 'image', content: m.url });
    lastIndex = m.index + m.url.length;
  });

  // Add remaining text
  if (lastIndex < tempText.length) {
    parts.push({ type: 'text', content: tempText.substring(lastIndex) });
  }

  // If no images found, just return text
  if (parts.length === 0) {
    return (
      <span key={key} style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </span>
    );
  }

  // Render text and images
  return (
    <span key={key} style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, idx) => {
        if (part.type === 'image') {
          return (
            <img
              key={idx}
              src={part.content}
              alt="Question image"
              className="max-w-full h-auto my-2 rounded-lg border border-slate-200 dark:border-slate-700"
              style={{ maxHeight: '400px', display: 'block' }}
              onError={(e) => {
                // Fallback: show URL if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const link = document.createElement('a');
                link.href = part.content;
                link.textContent = part.content;
                link.className = 'text-blue-600 underline';
                link.target = '_blank';
                target.parentNode?.insertBefore(link, target.nextSibling);
              }}
            />
          );
        } else {
          return <span key={idx}>{part.content}</span>;
        }
      })}
    </span>
  );
}

export default function LaTeXRenderer({ content, className = '' }: LaTeXRendererProps) {
  // Handle undefined or null content
  if (!content) {
    return <div className={className}></div>;
  }

  // Split content by LaTeX delimiters
  // Use multiline matching and better handling for block vs inline math
  // Match $$...$$ (block math) first, then $...$ (inline math)
  // The (?s) flag makes . match newlines
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineMathRegex = /\$([^$\n]+?)\$/g;

  const parts: Array<{ type: 'block' | 'inline' | 'text'; content: string; index: number }> = [];
  let lastIndex = 0;
  let partIndex = 0;

  // First, find all block math ($$...$$)
  const blockMatches: Array<{ start: number; end: number; content: string }> = [];
  let match;

  // Reset regex
  blockMathRegex.lastIndex = 0;
  while ((match = blockMathRegex.exec(content)) !== null) {
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1], // Content without $$
    });
  }

  // Then find inline math, but skip if it's inside block math
  const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
  inlineMathRegex.lastIndex = 0;
  while ((match = inlineMathRegex.exec(content)) !== null) {
    // Check if this inline math is inside a block math
    const isInsideBlock = blockMatches.some(
      bm => match!.index >= bm.start && match!.index < bm.end
    );
    if (!isInsideBlock) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1], // Content without $
      });
    }
  }

  // Combine and sort all matches
  const allMatches = [
    ...blockMatches.map(m => ({ ...m, type: 'block' as const })),
    ...inlineMatches.map(m => ({ ...m, type: 'inline' as const })),
  ].sort((a, b) => a.start - b.start);

  // Build parts array
  allMatches.forEach(match => {
    // Add text before this match
    if (match.start > lastIndex) {
      const text = content.substring(lastIndex, match.start);
      if (text) {
        parts.push({ type: 'text', content: text, index: partIndex++ });
      }
    }

    // Add the math match
    parts.push({
      type: match.type,
      content: match.content,
      index: partIndex++
    });

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.substring(lastIndex);
    if (text) {
      parts.push({ type: 'text', content: text, index: partIndex++ });
    }
  }

  // If no matches found, return entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content, index: 0 });
  }

  return (
    <div className={className}>
      {parts.map((part) => {
        if (part.type === 'block') {
          try {
            return <BlockMath key={part.index} math={part.content} />;
          } catch (e) {
            // If rendering fails, show as code
            return <code key={part.index} className="text-xs">$${part.content}$$</code>;
          }
        } else if (part.type === 'inline') {
          // Check if content contains block-level LaTeX environments
          // These should be rendered as block math even if wrapped in single $
          const blockLevelEnvs = [
            '\\begin{array}',
            '\\begin{matrix}',
            '\\begin{vmatrix}',
            '\\begin{pmatrix}',
            '\\begin{bmatrix}',
            '\\begin{Vmatrix}',
            '\\begin{cases}',
            '\\begin{aligned}',
            '\\begin{align}',
            '\\begin{alignat}',
            '\\begin{eqnarray}',
            '\\begin{gather}',
            '\\begin{multline}',
            '\\begin{split}',
            '\\begin{equation}',
          ];

          const containsBlockEnv = blockLevelEnvs.some(env =>
            part.content.includes(env)
          );

          // Also check if it's multiline (likely block math)
          const isMultiline = part.content.includes('\\\\') || part.content.includes('\n');

          if (containsBlockEnv || isMultiline) {
            // Render as block math instead
            try {
              return <BlockMath key={part.index} math={part.content} />;
            } catch (e) {
              return <code key={part.index} className="text-xs">${part.content}$</code>;
            }
          }

          try {
            return <InlineMath key={part.index} math={part.content} />;
          } catch (e) {
            // If rendering fails, show as code
            return <code key={part.index} className="text-xs">${part.content}$</code>;
          }
        } else {
          // Regular text - check for image URLs and render them
          return renderTextWithImages(part.content, part.index);
        }
      })}
    </div>
  );
}

// Helper function to extract LaTeX from text
export function extractLaTeX(content: string): string[] {
  const latexMatches = content.match(/\$\$.*?\$\$|\$.*?\$/g);
  return latexMatches || [];
}

// Helper function to check if content contains LaTeX
export function hasLaTeX(content: string): boolean {
  return /\$\$.*?\$\$|\$.*?\$/.test(content);
}

