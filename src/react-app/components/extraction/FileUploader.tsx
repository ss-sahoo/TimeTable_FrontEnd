/**
 * FileUploader Component
 * Drag-and-drop file upload for question extraction
 */
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  acceptedFileTypes = ['.txt', '.docx', '.doc', '.pdf', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 10,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError('');

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${maxSizeMB}MB`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError(
            `Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`
          );
        } else {
          setError('File upload failed. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, acceptedFileTypes, maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  const removeFile = () => {
    setSelectedFile(null);
    setError('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload
            className={`mx-auto mb-4 ${
              isDragActive ? 'text-blue-500' : 'text-gray-400'
            }`}
            size={48}
          />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop a file here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: PDF, DOCX, DOC, TXT, JPG, PNG
          </p>
          <p className="text-xs text-gray-400">Maximum file size: {maxSizeMB}MB</p>
        </div>
      ) : (
        <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <File className="text-green-600 flex-shrink-0" size={24} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Remove file"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
