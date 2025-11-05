import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Clock, Flag, RotateCcw } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import { Exam, Question } from '@/shared/types';

interface QuestionStatus {
  [key: number]: 'unattempted' | 'answered' | 'marked_for_review';
}

export default function StudentExamView() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [questionStatus, setQuestionStatus] = useState<QuestionStatus>({});
  const [timeRemaining, setTimeRemaining] = useState(10800); // 3 hours in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { data: exam } = useApi<Exam>(`/exams/exams/${examId}/`);
  const { data: question } = useApi<Question>(`/questions/questions/${currentQuestion}?exam_id=${examId}`, [currentQuestion]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto submit when time runs out
      handleSubmit();
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion]: 'answered'
    }));
  };

  const handleMarkForReview = () => {
    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion]: 'marked_for_review'
    }));
  };

  const handleClearAnswer = () => {
    setSelectedAnswer('');
    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion]: 'unattempted'
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < 90) { // Assuming 90 questions total
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer('');
    }
  };

  const handleQuestionNavigation = (questionNumber: number) => {
    setCurrentQuestion(questionNumber);
    setSelectedAnswer('');
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    // In a real app, you'd submit answers to the server
    navigate('/student-dashboard');
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-green-500 text-white';
      case 'marked_for_review':
        return 'bg-red-500 text-white';
      default:
        return 'bg-slate-200 text-slate-600 hover:bg-slate-300';
    }
  };

  const getSectionQuestions = (start: number, end: number) => {
    const questions = [];
    for (let i = start; i <= end; i++) {
      questions.push(i);
    }
    return questions;
  };

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
              <p className="text-sm text-slate-600">Online Examination Portal</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-lg font-mono">
                <Clock className="w-5 h-5 text-red-500" />
                <span className={`font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-slate-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Question {currentQuestion}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {currentQuestion <= 30 ? 'Part A - MCQ' : currentQuestion <= 60 ? 'Part B - Numerical' : 'Part C - Subjective'}
                  </span>
                </div>
              </div>

              {/* Question Content */}
              {question ? (
                <div className="space-y-6">
                  <div className="text-slate-800 leading-relaxed">
                    {question.text}
                  </div>

                  {/* Options for MCQ */}
                  {question.question_type === 'Single Correct MCQ' && question.options && (
                    <div className="space-y-3">
                      {(Array.isArray(question.options) ? question.options : JSON.parse(question.options as string)).map((option: string, index: number) => (
                        <label
                          key={index}
                          className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={String.fromCharCode(65 + index)}
                            checked={selectedAnswer === String.fromCharCode(65 + index)}
                            onChange={(e) => handleAnswerSelect(e.target.value)}
                            className="mt-1"
                          />
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-slate-700">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Answer input for Numerical */}
                  {question.question_type === 'Numerical' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Answer
                      </label>
                      <input
                        type="text"
                        value={selectedAnswer}
                        onChange={(e) => {
                          setSelectedAnswer(e.target.value);
                          if (e.target.value.trim()) {
                            setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'answered' }));
                          }
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your numerical answer"
                      />
                    </div>
                  )}

                  {/* Answer area for Subjective */}
                  {question.question_type === 'Subjective' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Answer
                      </label>
                      <textarea
                        value={selectedAnswer}
                        onChange={(e) => {
                          setSelectedAnswer(e.target.value);
                          if (e.target.value.trim()) {
                            setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'answered' }));
                          }
                        }}
                        className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Write your detailed answer here..."
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600">Loading question...</p>
                </div>
              )}

              {/* Question Controls */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleMarkForReview}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Mark for Review
                  </button>
                  <button
                    onClick={handleClearAnswer}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 1}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestion === 90}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Question Palette</h3>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-200 rounded"></div>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Current</span>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                {/* Part A - MCQ */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Part A - MCQ (1-30)</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {getSectionQuestions(1, 30).map((qNum) => (
                      <button
                        key={qNum}
                        onClick={() => handleQuestionNavigation(qNum)}
                        className={`w-8 h-8 text-xs rounded transition-colors ${
                          currentQuestion === qNum
                            ? 'bg-blue-500 text-white'
                            : getQuestionStatusColor(questionStatus[qNum] || 'unattempted')
                        }`}
                      >
                        {qNum}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Part B - Numerical */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Part B - Numerical (31-60)</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {getSectionQuestions(31, 60).map((qNum) => (
                      <button
                        key={qNum}
                        onClick={() => handleQuestionNavigation(qNum)}
                        className={`w-8 h-8 text-xs rounded transition-colors ${
                          currentQuestion === qNum
                            ? 'bg-blue-500 text-white'
                            : getQuestionStatusColor(questionStatus[qNum] || 'unattempted')
                        }`}
                      >
                        {qNum}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Part C - Subjective */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Part C - Subjective (61-90)</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {getSectionQuestions(61, 90).map((qNum) => (
                      <button
                        key={qNum}
                        onClick={() => handleQuestionNavigation(qNum)}
                        className={`w-8 h-8 text-xs rounded transition-colors ${
                          currentQuestion === qNum
                            ? 'bg-blue-500 text-white'
                            : getQuestionStatusColor(questionStatus[qNum] || 'unattempted')
                        }`}
                      >
                        {qNum}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Answered:</span>
                    <span className="font-semibold ml-2 text-green-600">
                      {Object.values(questionStatus).filter(status => status === 'answered').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Review:</span>
                    <span className="font-semibold ml-2 text-red-600">
                      {Object.values(questionStatus).filter(status => status === 'marked_for_review').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Submit Exam</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to submit the exam? You won't be able to make any changes after submission.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
