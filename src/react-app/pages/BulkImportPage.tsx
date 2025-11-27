import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Eye, Map, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../hooks/useApi';

// Import existing components
import FileUploader from '../components/extraction/FileUploader';
import ExtractionProgress from '../components/extraction/ExtractionProgress';
import QuestionPreview from '../components/extraction/QuestionPreview';

// Import new components (to be created)
import StepIndicator from '../components/extraction/StepIndicator';
import PatternMappingStep from '../components/extraction/PatternMappingStep';
import MismatchResolverStep from '../components/extraction/MismatchResolverStep';
import FinalizationStep from '../components/extraction/FinalizationStep';

interface BulkImportState {
  currentStep: number;
  jobId: string | null;
  extractedQuestions: any[];
  patternStructure: any;
  mappings: Record<number, any>;
  mismatches: any;
}

const STEPS = [
  { id: 1, name: 'Upload', icon: Upload, description: 'Upload question file' },
  { id: 2, name: 'Extract', icon: Eye, description: 'AI extraction in progress' },
  { id: 3, name: 'Review', icon: Eye, description: 'Review extracted questions' },
  { id: 4, name: 'Map', icon: Map, description: 'Map to pattern sections' },
  { id: 5, name: 'Resolve', icon: AlertTriangle, description: 'Handle mismatches' },
  { id: 6, name: 'Finalize', icon: CheckCircle, description: 'Review and import' },
];

export default function BulkImportPage() {
  const { examId, patternId } = useParams<{ examId: string; patternId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<BulkImportState>({
    currentStep: 1,
    jobId: null,
    extractedQuestions: [],
    patternStructure: null,
    mappings: {},
    mismatches: null,
  });

  const handleFileUploaded = (jobId: string) => {
    console.log('handleFileUploaded called with jobId:', jobId); // Debug log
    setState(prev => {
      const newState = { ...prev, jobId, currentStep: 2 };
      console.log('New state after file upload:', newState); // Debug log
      return newState;
    });
  };

  const handleFileSelect = async (file: File) => {
    try {
      // Upload file to backend using the api utility
      const formData = new FormData();
      formData.append('file', file);
      formData.append('exam_id', examId!);
      formData.append('pattern_id', patternId!);

      const response = await api.post('/questions/bulk-extract/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('API Response:', response.data); // Debug log
      
      if (response.data.job_id) {
        console.log('Job ID received from API:', response.data.job_id); // Debug log
        handleFileUploaded(response.data.job_id);
      } else {
        throw new Error('No job ID returned from server');
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload file';
      alert(`Upload failed: ${errorMessage}`);
    }
  };

  const handleExtractionComplete = () => {
    // Extraction is complete, move to review step
    // Questions will be loaded by QuestionPreview component
    setState(prev => ({ ...prev, currentStep: 3 }));
  };

  const handleExtractionError = (error: string) => {
    console.error('Extraction error:', error);
    alert(`Extraction failed: ${error}`);
    setState(prev => ({ ...prev, currentStep: 1 })); // Go back to upload step
  };

  const handleQuestionsLoaded = (questions: any[]) => {
    setState(prev => ({ ...prev, extractedQuestions: questions }));
  };

  const handleSelectionChange = (selectedIds: number[]) => {
    // Store selected question IDs if needed
    console.log('Selected question IDs:', selectedIds);
  };

  const handleReviewComplete = () => {
    setState(prev => ({ ...prev, currentStep: 4 }));
  };

  const handleMappingComplete = (mappings: Record<number, any>, mismatches: any) => {
    console.log('Mapping complete. Mappings:', mappings, 'Mismatches:', mismatches); // Debug log
    setState(prev => ({ 
      ...prev, 
      mappings, 
      mismatches,
      currentStep: mismatches?.summary?.has_mismatches ? 5 : 6 
    }));
  };

  const handleMismatchesResolved = () => {
    setState(prev => ({ ...prev, currentStep: 6 }));
  };

  const handleImportComplete = () => {
    navigate(`/pattern/${patternId}/questions?examId=${examId}`);
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    } else {
      navigate(-1);
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <FileUploader
            onFileSelect={handleFileSelect}
            acceptedFileTypes={['.txt', '.docx', '.doc', '.pdf']}
            maxSizeMB={10}
          />
        );

      case 2:
        console.log('Rendering ExtractionProgress with jobId:', state.jobId); // Debug log
        if (!state.jobId) {
          return <div className="text-red-500">Error: No job ID available</div>;
        }
        return (
          <ExtractionProgress
            jobId={state.jobId}
            onComplete={handleExtractionComplete}
            onError={handleExtractionError}
          />
        );

      case 3:
        if (!state.jobId) {
          return <div className="text-red-500">Error: No job ID available</div>;
        }
        return (
          <QuestionPreview
            jobId={state.jobId}
            onQuestionsLoaded={handleQuestionsLoaded}
            onSelectionChange={handleSelectionChange}
            onNext={handleReviewComplete}
          />
        );

      case 4:
        return (
          <PatternMappingStep
            examId={parseInt(examId!)}
            patternId={parseInt(patternId!)}
            jobId={state.jobId!}
            questions={state.extractedQuestions}
            onComplete={handleMappingComplete}
          />
        );

      case 5:
        return (
          <MismatchResolverStep
            mismatches={state.mismatches}
            questions={state.extractedQuestions}
            mappings={state.mappings}
            onResolved={handleMismatchesResolved}
          />
        );

      case 6:
        return (
          <FinalizationStep
            examId={parseInt(examId!)}
            patternId={parseInt(patternId!)}
            jobId={state.jobId!}
            mappings={state.mappings}
            onComplete={handleImportComplete}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Bulk Question Import
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Upload and intelligently map questions to your exam pattern
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StepIndicator steps={STEPS} currentStep={state.currentStep} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
