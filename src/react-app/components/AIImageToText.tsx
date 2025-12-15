import { useState } from 'react';
import { Upload, Copy, Loader, FileImage, X, CheckCircle, Sparkles, Eye } from 'lucide-react';
import { api } from '../hooks/useApi';
import LaTeXRenderer from './LaTeXRenderer';

interface ExtractedQuestionData {
  question_text?: string;
  options?: string[];
  correct_answer?: string;
  solution?: string;
  explanation?: string;
}

interface AIImageToTextProps {
  className?: string;
  onExtractedText?: (text: string) => void;
  onExtractedQuestion?: (data: ExtractedQuestionData) => void;
}

export default function AIImageToText({ 
  className = "", 
  onExtractedText,
  onExtractedQuestion 
}: AIImageToTextProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedStructure, setParsedStructure] = useState<ExtractedQuestionData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLatex, setHasLatex] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleImageUpload = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      setShowUploadArea(false);
      processImage(file);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/questions/image-to-text/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = response.data;
      
      if (data.success) {
        setExtractedText(data.extracted_text);
        setHasLatex(data.has_latex || false);
        
        // Notify parent component with extracted text
        if (onExtractedText) {
          onExtractedText(data.extracted_text);
        }
        
        // Use parsed structure from API (Gemini AI parsed) if available
        if (data.parsed_structure) {
          const parsedStructure = data.parsed_structure;
          const parsedQuestion: ExtractedQuestionData = {
            question_text: parsedStructure.question_text || data.extracted_text,
            options: parsedStructure.options || [],
            correct_answer: parsedStructure.correct_answer || '',
            solution: parsedStructure.solution || '',
            explanation: parsedStructure.solution || '', // Alias for compatibility
          };
          setParsedStructure(parsedQuestion);
          
          // Notify parent component
          if (onExtractedQuestion) {
            onExtractedQuestion(parsedQuestion);
          }
        } else {
          // No parsed structure available, clear it
          setParsedStructure(null);
        }
      } else {
        setError(data.error || 'Failed to extract text from image');
      }
    } catch (err: any) {
      console.error('Image extraction failed:', err);
      setError(err.response?.data?.error || 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = extractedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const useAsQuestion = () => {
    if (onExtractedText) {
      onExtractedText(extractedText);
    }
    // Use parsed structure from API if available, otherwise just use text
    if (onExtractedQuestion) {
      if (parsedStructure) {
        onExtractedQuestion(parsedStructure);
      } else {
        // Fallback: create basic structure from text
        onExtractedQuestion({
          question_text: extractedText,
          options: [],
          correct_answer: '',
          solution: '',
        });
      }
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setExtractedText('');
    setParsedStructure(null);
    setShowUploadArea(true);
    setIsProcessing(false);
    setError(null);
    setHasLatex(false);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-slate-900">AI Image to Text</h3>
        </div>
        {uploadedImage && (
          <button
            onClick={resetUpload}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            title="Reset"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showUploadArea && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-1">Upload an image</p>
            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
          </label>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {uploadedImage && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full h-32 object-cover rounded-lg border border-slate-200"
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              <FileImage className="w-3 h-3 inline mr-1" />
              Uploaded
            </div>
          </div>

          {isProcessing ? (
            <div className="flex items-center justify-center py-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
              <span className="text-sm text-slate-600">AI is extracting text...</span>
            </div>
          ) : extractedText ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Extracted Text
                  {hasLatex && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Contains LaTeX
                    </span>
                  )}
                </label>
              </div>
              
              {/* LaTeX Preview */}
              {hasLatex && extractedText && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
                  <div className="text-xs font-medium text-slate-600 mb-2">LaTeX Preview:</div>
                  <div className="text-sm text-slate-800 max-h-32 overflow-y-auto">
                    <LaTeXRenderer content={extractedText} />
                  </div>
                </div>
              )}
              
              <div className="relative">
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm font-mono"
                  placeholder="Extracted text will appear here..."
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={useAsQuestion}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Use as Question
                </button>
                {parsedStructure && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                )}
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <p className="text-xs text-slate-500">
                Click "Use as Question" to auto-fill the question form, or copy and paste manually.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {!showUploadArea && !isProcessing && !extractedText && !error && (
        <div className="text-center py-4">
          <Loader className="w-5 h-5 animate-spin text-purple-500 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Processing...</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && parsedStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Question Preview</h3>
                  <p className="text-xs text-slate-500">Full parsed structure with LaTeX rendering</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Question Text
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-base leading-relaxed">
                  <LaTeXRenderer content={parsedStructure.question_text || extractedText} />
                </div>
              </div>

              {/* Options */}
              {parsedStructure.options && parsedStructure.options.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {parsedStructure.options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          parsedStructure.correct_answer && 
                          (parsedStructure.correct_answer === String.fromCharCode(65 + index) || 
                           parsedStructure.correct_answer === String(index + 1) ||
                           parsedStructure.correct_answer.toLowerCase() === option.toLowerCase())
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          parsedStructure.correct_answer && 
                          (parsedStructure.correct_answer === String.fromCharCode(65 + index) || 
                           parsedStructure.correct_answer === String(index + 1) ||
                           parsedStructure.correct_answer.toLowerCase() === option.toLowerCase())
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="flex-1 text-base">
                          <LaTeXRenderer content={option} />
                        </div>
                        {parsedStructure.correct_answer && 
                         (parsedStructure.correct_answer === String.fromCharCode(65 + index) || 
                          parsedStructure.correct_answer === String(index + 1) ||
                          parsedStructure.correct_answer.toLowerCase() === option.toLowerCase()) && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              {parsedStructure.correct_answer && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Correct Answer
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {(() => {
                          const answer = parsedStructure.correct_answer.trim();
                          const options = parsedStructure.options || [];
                          
                          // Try to match the answer to an option
                          let optionIndex = -1;
                          
                          // Check if answer is a number (1, 2, 3, 4) - convert to index
                          const numericMatch = answer.match(/^\(?(\d+)\)?$/);
                          if (numericMatch) {
                            optionIndex = parseInt(numericMatch[1]) - 1;
                          } else {
                            // Check if answer is a letter (A, B, C, D) - convert to index
                            const letterMatch = answer.match(/^\(?([A-Da-d])\)?$/);
                            if (letterMatch) {
                              const letter = letterMatch[1].toUpperCase();
                              optionIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                            } else {
                              // Try to find matching option text
                              optionIndex = options.findIndex(
                                opt => opt.trim().toLowerCase() === answer.toLowerCase() ||
                                       opt.trim() === answer
                              );
                            }
                          }
                          
                          // If we found a matching option
                          if (optionIndex >= 0 && optionIndex < options.length) {
                            const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                            const optionText = options[optionIndex];
                            
                            return (
                              <div className="space-y-1">
                                <div className="text-base font-semibold text-green-900">
                                  Option {optionLetter}: <LaTeXRenderer content={optionText} />
                                </div>
                              </div>
                            );
                          }
                          
                          // If no match found, just display the answer as-is
                          return (
                            <div className="text-base font-medium text-green-900">
                              <LaTeXRenderer content={answer} />
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Solution */}
              {(parsedStructure.solution || parsedStructure.explanation) && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Solution / Explanation
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-base leading-relaxed">
                    <LaTeXRenderer content={parsedStructure.solution || parsedStructure.explanation || ''} />
                  </div>
                </div>
              )}

              {/* Raw Text (for reference) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Raw Extracted Text
                </label>
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono overflow-x-auto">
                    {extractedText}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  useAsQuestion();
                  setShowPreview(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all text-sm font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Use as Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
