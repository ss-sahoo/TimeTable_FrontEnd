import { useState } from 'react';
import { Upload, Copy, Loader, FileImage, X } from 'lucide-react';

interface AIImageToTextProps {
  className?: string;
}

export default function AIImageToText({ className = "" }: AIImageToTextProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(true);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      setShowUploadArea(false);
      processImage(file);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (_file: File) => {
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      // Mock extracted text based on common exam content
      const mockTexts = [
        "A particle moves in a circle of radius 5 m with constant speed 10 m/s. What is the magnitude of its centripetal acceleration?",
        "The equation x² + y² = 25 represents a circle with center at origin and radius 5 units.",
        "Given: Force F = 20 N, Mass m = 5 kg. Find the acceleration using Newton's second law.",
        "Calculate the derivative of f(x) = 3x² + 2x - 1 with respect to x.",
        "A triangle has sides of length 3, 4, and 5 units. What type of triangle is this?"
      ];
      
      const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
      setExtractedText(randomText);
      setIsProcessing(false);
    }, 2000);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    // You could add a toast notification here
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setExtractedText('');
    setShowUploadArea(true);
    setIsProcessing(false);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">AI Image to Text</h3>
        {uploadedImage && (
          <button
            onClick={resetUpload}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showUploadArea && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
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
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-slate-600">AI is extracting text...</span>
            </div>
          ) : extractedText ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Extracted Text
              </label>
              <div className="relative">
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  placeholder="Extracted text will appear here..."
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-slate-500">
                You can edit the extracted text and copy it to your question or options.
              </div>
            </div>
          ) : null}
        </div>
      )}

      {!showUploadArea && !isProcessing && !extractedText && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-600">Processing...</p>
        </div>
      )}
    </div>
  );
}
