import { useState } from 'react';
import { Upload, Copy, Loader, FileImage, X, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../hooks/useApi';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLatex, setHasLatex] = useState(false);
  const [copied, setCopied] = useState(false);

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
        
        // Notify parent component
        if (onExtractedText) {
          onExtractedText(data.extracted_text);
        }
        
        // Try to parse question structure from extracted text
        if (onExtractedQuestion) {
          const parsedQuestion = parseQuestionFromText(data.extracted_text);
          if (parsedQuestion) {
            onExtractedQuestion(parsedQuestion);
          }
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

  // Parse question structure from extracted text
  const parseQuestionFromText = (text: string): ExtractedQuestionData | null => {
    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      
      // Try to find question text (before options)
      let questionText = '';
      const options: string[] = [];
      let correctAnswer = '';
      let solution = '';
      
      let inOptions = false;
      let inSolution = false;
      
      for (const line of lines) {
        // Check for option patterns: A), (A), A., a)
        const optionMatch = line.match(/^[\(\[]?([A-Da-d])[\)\]\.]\s*(.+)/);
        
        // Check for answer pattern
        const answerMatch = line.match(/^(?:Answer|Ans|Correct)[:\s]+([A-Da-d])/i);
        
        // Check for solution pattern
        const solutionMatch = line.match(/^(?:Solution|Explanation|Hint)[:\s]+(.*)/i);
        
        if (answerMatch) {
          correctAnswer = answerMatch[1].toUpperCase();
        } else if (solutionMatch) {
          inSolution = true;
          solution = solutionMatch[1] || '';
        } else if (optionMatch) {
          inOptions = true;
          options.push(optionMatch[2].trim());
        } else if (inSolution) {
          solution += ' ' + line;
        } else if (!inOptions) {
          questionText += (questionText ? ' ' : '') + line;
        }
      }
      
      // If we found a question structure, return it
      if (questionText && options.length >= 2) {
        return {
          question_text: questionText.trim(),
          options: options,
          correct_answer: correctAnswer,
          solution: solution.trim(),
        };
      }
      
      // If no structure found, just return the text as question
      if (questionText || text) {
        return {
          question_text: questionText || text,
        };
      }
      
      return null;
    } catch {
      return null;
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
    if (onExtractedQuestion) {
      const parsed = parseQuestionFromText(extractedText);
      if (parsed) {
        onExtractedQuestion(parsed);
      }
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setExtractedText('');
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
              <div className="relative">
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
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
    </div>
  );
}
