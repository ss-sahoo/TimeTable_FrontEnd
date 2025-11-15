import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXRendererProps {
  content: string;
  className?: string;
}

export default function LaTeXRenderer({ content, className = '' }: LaTeXRendererProps) {
  // Handle undefined or null content
  if (!content) {
    return <div className={className}></div>;
  }
  
  // Split content by LaTeX delimiters
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/);
  
  return (
    <div className={className}>
      {parts.map((part, index) => {
        // Block math ($$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return (
            <BlockMath key={index} math={math} />
          );
        }
        // Inline math ($...$)
        else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1);
          return (
            <InlineMath key={index} math={math} />
          );
        }
        // Regular text
        else if (part.trim()) {
          return <span key={index}>{part}</span>;
        }
        return null;
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

