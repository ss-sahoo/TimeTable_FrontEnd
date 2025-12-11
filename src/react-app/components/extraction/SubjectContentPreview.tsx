/**
 * SubjectContentPreview Component
 * Shows raw content separated by subject with download buttons
 * NO question extraction - just content categorization
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../hooks/useApi';
import {
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface SubjectContent {
  subject: string;
  content: string;
  contentLength: number;
}

interface DocumentSection {
  name: string;
  type_hint: string;
  question_range: string;
  format_description: string;
  start_marker: string;
}

interface DocumentStructure {
  has_instructions: boolean;
  instructions_text: string;
  sections: DocumentSection[];
  question_numbering_format: string;
  answer_format: string;
  total_sections: number;
}

interface SubjectContentPreviewProps {
  preAnalysisJobId: string;
  matchedSubjects: string[];
  documentStructure?: DocumentStructure | null;
  onBack: () => void;
  onProceed: () => void;
}

const SubjectContentPreview: React.FC<SubjectContentPreviewProps> = ({
  preAnalysisJobId,
  matchedSubjects,
  documentStructure,
  onBack,
  onProceed,
}) => {
  const [showStructure, setShowStructure] = useState(false);
  const [subjectContents, setSubjectContents] = useState<SubjectContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjectContents();
  }, [preAnalysisJobId]);

  const fetchSubjectContents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/questions/pre-analyze/${preAnalysisJobId}/subjects/`);
      
      const contents: SubjectContent[] = response.data.subjects.map((s: any) => ({
        subject: s.subject,
        content: s.content_preview,
        contentLength: s.full_content_length,
      }));
      
      setSubjectContents(contents);
      
      // Auto-expand first subject
      if (contents.length > 0) {
        setExpandedSubject(contents[0].subject);
      }
    } catch (err: any) {
      console.error('Failed to fetch subject contents:', err);
      setError(err.response?.data?.error || 'Failed to load subject content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSubject = async (subject: string) => {
    setDownloading(subject);
    try {
      const response = await api.get(
        `/questions/pre-analyze/${preAnalysisJobId}/subjects/${subject.toLowerCase()}/download/`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${subject}_Content.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading('all');
    try {
      // Download each subject and combine
      for (const subject of matchedSubjects) {
        await handleDownloadSubject(subject);
      }
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading subject content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Content Separated by Subject</h2>
            <p className="text-sm text-gray-600 mt-1">
              Your document has been categorized into {matchedSubjects.length} subject(s)
            </p>
          </div>
          <button
            onClick={handleDownloadAll}
            disabled={downloading === 'all'}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {downloading === 'all' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>Download All</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
            <p className="text-2xl font-bold text-indigo-600">{matchedSubjects.length}</p>
            <p className="text-sm text-gray-600">Subjects</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
            <p className="text-2xl font-bold text-purple-600">
              {subjectContents.reduce((sum, s) => sum + s.contentLength, 0) > 1024
                ? `${Math.round(subjectContents.reduce((sum, s) => sum + s.contentLength, 0) / 1024)}KB`
                : `${subjectContents.reduce((sum, s) => sum + s.contentLength, 0)}B`}
            </p>
            <p className="text-sm text-gray-600">Total Size</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
            <p className="text-2xl font-bold text-green-600">{documentStructure?.total_sections || 0}</p>
            <p className="text-sm text-gray-600">Sections Detected</p>
          </div>
        </div>
      </div>

      {/* Document Structure Section */}
      {documentStructure && documentStructure.sections && documentStructure.sections.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div
            className="flex items-center justify-between p-4 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => setShowStructure(!showStructure)}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Document Structure Detected</h3>
                <p className="text-sm text-gray-600">
                  {documentStructure.total_sections} section(s) found in the document
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {showStructure ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {showStructure && (
            <div className="p-4 border-t border-gray-200">
              {/* Instructions */}
              {documentStructure.has_instructions && documentStructure.instructions_text && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">📋 Document Instructions:</p>
                  <p className="text-sm text-blue-700">{documentStructure.instructions_text}</p>
                </div>
              )}

              {/* Format Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Question Format</p>
                  <p className="text-sm font-medium text-gray-900">{documentStructure.question_numbering_format || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Answer Format</p>
                  <p className="text-sm font-medium text-gray-900">{documentStructure.answer_format || 'Unknown'}</p>
                </div>
              </div>

              {/* Sections */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Detected Sections:</p>
                <div className="space-y-2">
                  {documentStructure.sections.map((section, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{section.name}</span>
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                          {section.type_hint}
                        </span>
                      </div>
                      {section.question_range && section.question_range !== 'Unknown' && (
                        <p className="text-xs text-gray-500">Questions: {section.question_range}</p>
                      )}
                      {section.format_description && (
                        <p className="text-xs text-gray-500 mt-1">{section.format_description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subject Cards */}
      <div className="space-y-4">
        {subjectContents.map((subjectContent) => (
          <div
            key={subjectContent.subject}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            {/* Subject Header */}
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedSubject(
                expandedSubject === subjectContent.subject ? null : subjectContent.subject
              )}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{subjectContent.subject}</h3>
                  <p className="text-sm text-gray-500">
                    {subjectContent.contentLength > 1024 
                      ? `${Math.round(subjectContent.contentLength / 1024)}KB`
                      : `${subjectContent.contentLength}B`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSubject(subjectContent.subject);
                  }}
                  disabled={downloading === subjectContent.subject}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {downloading === subjectContent.subject ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download</span>
                </button>
                {expandedSubject === subjectContent.subject ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Content Preview */}
            {expandedSubject === subjectContent.subject && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Content Preview</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {subjectContent.content}
                  </pre>
                </div>
                {subjectContent.contentLength > subjectContent.content.length && (
                  <div className="mt-3 flex items-center space-x-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Preview truncated. Download the file to see full content.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-500">
            Download the files to review the categorized content
          </p>
          <button
            onClick={onProceed}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Continue to Import →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectContentPreview;
