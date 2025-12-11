/**
 * SubjectPreview Component
 * Displays tabs for each detected subject with preview content
 * and download buttons for subject-separated files
 */
import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  ChevronLeft,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface SubjectData {
  subject: string;
  question_count: number;
  content_preview: string;
  full_content_length: number;
  download_url: string;
}

interface SubjectPreviewProps {
  jobId: string;
  subjects: SubjectData[];
  documentType: string;
  totalQuestions: number;
  onBack: () => void;
  onDownload: (subject: string) => void;
}

const SubjectPreview: React.FC<SubjectPreviewProps> = ({
  jobId,
  subjects,
  documentType,
  totalQuestions,
  onBack,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    subjects.length > 0 ? subjects[0].subject : ''
  );
  const [expandedPreview, setExpandedPreview] = useState<boolean>(false);

  const activeSubject = subjects.find(s => s.subject === activeTab);

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Subject-wise Content Preview
              </h3>
              <p className="text-sm text-gray-500">
                {subjects.length} subjects • {totalQuestions} total questions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {subjects.map((subject) => (
            <button
              key={subject.subject}
              onClick={() => setActiveTab(subject.subject)}
              className={`
                flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === subject.subject
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span>{subject.subject}</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {subject.question_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeSubject && (
        <div className="p-4">
          {/* Subject Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{activeSubject.subject}</h4>
                <p className="text-sm text-gray-500">
                  ~{activeSubject.question_count} questions • {Math.round(activeSubject.full_content_length / 1024)}KB
                </p>
              </div>
            </div>
            <button
              onClick={() => onDownload(activeSubject.subject)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
          </div>

          {/* Preview Content */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-100 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Eye size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Content Preview</span>
              </div>
              <button
                onClick={() => setExpandedPreview(!expandedPreview)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {expandedPreview ? 'Show Less' : 'Show More'}
              </button>
            </div>
            <div className={`p-4 overflow-auto ${expandedPreview ? 'max-h-96' : 'max-h-48'}`}>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {activeSubject.content_preview}
              </pre>
            </div>
            {activeSubject.full_content_length > activeSubject.content_preview.length && (
              <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 rounded-b-lg">
                <div className="flex items-center space-x-2 text-sm text-yellow-700">
                  <AlertTriangle size={16} />
                  <span>
                    Preview truncated. Download the file to see full content.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download All Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          {subjects.map((subject) => (
            <button
              key={subject.subject}
              onClick={() => onDownload(subject.subject)}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors text-sm"
            >
              <Download size={16} />
              <span>{subject.subject}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectPreview;
