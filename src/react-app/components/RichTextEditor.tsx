import { useState, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Image, Calculator, ChevronDown, ChevronUp, Upload, Eye, X } from 'lucide-react';
import LaTeXRenderer from './LaTeXRenderer';

// Helper component to render text with markdown-style formatting and LaTeX
const FormattedTextPreview = ({ content }: { content: string }) => {
  if (!content) return <div className="text-slate-400">Preview will appear here...</div>;
  
  // Split by LaTeX first to preserve equations
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/);
  
  return (
    <div className="prose prose-sm max-w-none">
      {parts.map((part, index) => {
        // If this is a LaTeX equation, render it with LaTeXRenderer
        if (part.startsWith('$$') || part.startsWith('$')) {
          return <LaTeXRenderer key={index} content={part} />;
        }
        
        // Handle markdown-style formatting for regular text
        let formatted = part;
        
        // Replace **bold** with <strong> (use a placeholder to avoid conflicts)
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '___BOLD_START___$1___BOLD_END___');
        
        // Replace *italic* with <em> (now safe since bold is replaced)
        formatted = formatted.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
        
        // Replace bold placeholders with actual tags
        formatted = formatted.replace(/___BOLD_START___/g, '<strong>');
        formatted = formatted.replace(/___BOLD_END___/g, '</strong>');
        
        // Handle lists (both ordered and unordered)
        const lines = formatted.split('\n');
        const processedLines = lines.map(line => {
          // Ordered list (1. item format)
          if (/^\d+\.\s/.test(line)) {
            return { type: 'ol', content: line.replace(/^(\d+)\.\s(.*)$/, '<li>$2</li>') };
          }
          // Unordered list (• item or - item format)
          if (/^[•-]\s/.test(line)) {
            return { type: 'ul', content: line.replace(/^[•-]\s(.*)$/, '<li>$1</li>') };
          }
          return { type: 'text', content: line };
        });
        
        // Wrap consecutive list items in appropriate tags
        let currentListType: string | null = null;
        const finalHtml = processedLines.reduce((acc, item, idx) => {
          if (item.type === 'ol' || item.type === 'ul') {
            if (currentListType !== item.type) {
              // Close previous list if different type
              if (currentListType) {
                acc += currentListType === 'ol' ? '</ol>' : '</ul>';
              }
              // Start new list
              currentListType = item.type;
              acc += item.type === 'ol' ? '<ol>' : '<ul>';
            }
            acc += item.content;
            
            // Close list if it's the last item or next item is not a list
            if (idx === processedLines.length - 1 || 
                (processedLines[idx + 1] && processedLines[idx + 1].type === 'text')) {
              acc += currentListType === 'ol' ? '</ol>' : '</ul>';
              currentListType = null;
            }
          } else {
            // Close any open list
            if (currentListType) {
              acc += currentListType === 'ol' ? '</ol>' : '</ul>';
              currentListType = null;
            }
            acc += item.content + (item.content ? '<br/>' : '');
          }
          return acc;
        }, '');
        
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: finalHtml }}
          />
        );
      })}
    </div>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter text here...", 
  className = "",
  label 
}: RichTextEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [equation, setEquation] = useState('');
  const [showSymbols, setShowSymbols] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleBold = () => insertText('**', '**');
  const handleItalic = () => insertText('*', '*');
  const handleOrderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lines = value.substring(0, start).split('\n');
    const currentLine = lines[lines.length - 1];
    
    // If at the start of a line or line is empty, insert numbered list
    if (currentLine.trim() === '' || start === 0) {
      insertText('\n1. ');
    } else {
      insertText('\n2. ');
    }
  };
  
  const handleUnorderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lines = value.substring(0, start).split('\n');
    const currentLine = lines[lines.length - 1];
    
    // If at the start of a line or line is empty, insert bullet list
    if (currentLine.trim() === '' || start === 0) {
      insertText('\n• ');
    } else {
      insertText('\n• ');
    }
  };

  const handleEquation = () => {
    if (equation.trim()) {
      insertText(`$$${equation}$$`);
      setEquation('');
      setShowEquationModal(false);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    insertText(`![Image](${imageUrl})`);
    setShowImageModal(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      
      {/* Toolbar */}
      <div className="border border-slate-300 rounded-t-lg bg-slate-50 p-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Basic formatting */}
          <button
            type="button"
            onClick={handleBold}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleItalic}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleOrderedList}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleUnorderedList}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-300"></div>

          {/* Advanced tools */}
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Import Image"
          >
            <Image className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => setShowEquationModal(true)}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Equation Editor"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {value.trim() && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded transition-colors ${
                showPreview ? 'bg-blue-200 text-blue-700' : 'hover:bg-slate-200'
              }`}
              title="Toggle Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-6 bg-slate-300"></div>

          {/* Advanced dropdown toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded transition-colors text-sm"
          >
            Advanced
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Advanced tools panel */}
        {showAdvanced && (
          <div className="mt-2 pt-2 border-t border-slate-300">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Advanced formatting tools will appear here</span>
            </div>
          </div>
        )}
      </div>

      {/* Text area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-32 px-3 py-2 border border-slate-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
      />

      {/* Formatted Preview */}
      {showPreview && value.trim() && (
        <div className="mt-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </h4>
          <div className="text-sm text-slate-800 bg-white p-3 rounded border border-blue-100">
            <FormattedTextPreview content={value} />
          </div>
        </div>
      )}

      {/* Equation Modal */}
      {showEquationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">LaTeX Equation Editor</h3>
              <button
                onClick={() => {
                  setShowEquationModal(false);
                  setEquation('');
                }}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Live Preview Section - Most Prominent */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-semibold text-blue-900">Live Preview</h4>
              </div>
              <div className="bg-white rounded-lg p-6 min-h-[100px] flex items-center justify-center border border-blue-200 shadow-sm">
                {equation ? (
                  <div className="text-lg">
                    <LaTeXRenderer content={equation.includes('$') ? equation : `$$${equation}$$`} />
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">Type or select a symbol below to see the preview...</div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Symbol Toolbar */}
              <div className="border border-slate-200 rounded-lg bg-slate-50">
                <button
                  onClick={() => setShowSymbols(!showSymbols)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
                >
                  <h4 className="text-sm font-medium text-slate-700">Mathematical Symbols</h4>
                  {showSymbols ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {showSymbols && (
                <div className="px-4 pb-4 space-y-4">
                
                {/* Basic Operations */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Basic Operations</p>
                  <div className="flex flex-wrap gap-1">
                    {['+', '-', '\\times', '\\div', '\\pm', '\\mp', '\\cdot', '\\ast'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relations */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Relations</p>
                  <div className="flex flex-wrap gap-1">
                    {['=', '\\neq', '<', '>', '\\leq', '\\geq', '\\ll', '\\gg', '\\approx', '\\equiv', '\\propto'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Greek Letters */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Greek Letters</p>
                  <div className="flex flex-wrap gap-1">
                    {['\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\theta', '\\lambda', '\\mu', '\\pi', '\\sigma', '\\tau', '\\phi', '\\chi', '\\psi', '\\omega'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculus & Analysis */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Calculus & Analysis</p>
                  <div className="flex flex-wrap gap-1">
                    {['\\int', '\\iint', '\\iiint', '\\oint', '\\sum', '\\prod', '\\lim', '\\infty', '\\partial', '\\nabla'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fractions & Powers */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Fractions & Powers</p>
                  <div className="flex flex-wrap gap-1">
                    {['\\frac{a}{b}', 'x^{y}', 'x_{y}', '\\sqrt{x}', '\\sqrt[n]{x}', 'x^2', 'x^3', 'x^n'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brackets */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Brackets</p>
                  <div className="flex flex-wrap gap-1">
                    {['()', '[]', '\\{\\}', '\\langle\\rangle', '\\left(\\right)', '\\left[\\right]', '\\left\\{\\right\\}'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Functions */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Functions</p>
                  <div className="flex flex-wrap gap-1">
                    {['\\sin', '\\cos', '\\tan', '\\log', '\\ln', '\\exp', '\\sinh', '\\cosh', '\\tanh'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arrows */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Arrows</p>
                  <div className="flex flex-wrap gap-1">
                    {['->', '\\<-', '\\leftrightarrow', '\\Rightarrow', '\\Leftarrow', '\\Leftrightarrow', '\\uparrow', '\\downarrow'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sets */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Sets</p>
                  <div className="flex flex-wrap gap-1">
                    {['\\in', '\\notin', '\\subset', '\\supset', '\\subseteq', '\\supseteq', '\\cup', '\\cap', '\\emptyset', '\\mathbb{R}', '\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{Q}'].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setEquation(prev => prev + symbol + ' ')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-sm font-mono"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
                </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  LaTeX Expression
                  <span className="text-xs text-slate-500 ml-2">(Type your equation or click symbols above)</span>
                </label>
                <textarea
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  placeholder="Try: x^2 + y^2 = r^2&#13;&#10;Or: \frac{-b \pm \sqrt{b^2-4ac}}{2a}&#13;&#10;Or: \int_{0}^{\infty} e^{-x} dx"
                  className="w-full h-32 px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-base resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  ✨ Tip: Changes appear in the preview above instantly!
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setEquation('')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setEquation('x^2 + y^2 = r^2')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Circle
                  </button>
                  <button
                    onClick={() => setEquation('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Quadratic
                  </button>
                  <button
                    onClick={() => setEquation('\\int_{a}^{b} f(x) \\, dx')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Integral
                  </button>
                  <button
                    onClick={() => setEquation('\\frac{d}{dx}[f(x)]')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Derivative
                  </button>
                  <button
                    onClick={() => setEquation('\\sum_{i=1}^{n} x_i')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Summation
                  </button>
                  <button
                    onClick={() => setEquation('\\lim_{x \\to \\infty} f(x)')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Limit
                  </button>
                  <button
                    onClick={() => setEquation('3.2 \\times 10^{-17}')}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-sm"
                  >
                    Scientific
                  </button>
                </div>
              </div>

              {/* LaTeX Help */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Quick LaTeX Guide:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div><code>x^2</code> → x²</div>
                  <div><code>x_1</code> → x₁</div>
                  <div><code>{'\\frac{a}{b}'}</code> → a/b</div>
                  <div><code>{'\\sqrt{x}'}</code> → √x</div>
                  <div><code>{'\\times'}</code> → ×</div>
                  <div><code>{'\\pm'}</code> → ±</div>
                  <div><code>{'10^{-17}'}</code> → 10⁻¹⁷</div>
                  <div><code>{'\\infty'}</code> → ∞</div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowEquationModal(false);
                    setEquation('');
                  }}
                  className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEquation}
                  disabled={!equation.trim()}
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  Insert Equation into Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Import Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleImageUpload(e.currentTarget.value.trim());
                    }
                  }}
                />
              </div>
              <div className="text-center text-slate-500 text-sm">or</div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                <input type="file" className="hidden" accept="image/*" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
