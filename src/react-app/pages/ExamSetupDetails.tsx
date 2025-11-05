import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, BookOpen, Plus, Edit3, List, FileText, Calendar, Clock } from 'lucide-react';
import { useApi, api } from '@/react-app/hooks/useApi';
import { Exam, ExamSubject, ExamSection, CreateSection } from '@/shared/types';
import CreateSectionModal from '@/react-app/components/CreateSectionModal';

export default function ExamSetupDetails() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');
  const [isSavingSyllabus, setIsSavingSyllabus] = useState(false);
  const [showEditExam, setShowEditExam] = useState(false);
  const [examFormData, setExamFormData] = useState({
    start_date: '',
    end_date: '',
    duration_minutes: 0,
  });
  const [isSavingExam, setIsSavingExam] = useState(false);

  const { data: exam, loading: examLoading, refetch: refetchExam } = useApi<Exam>(`/api/exams/${examId}`);
  const { data: subjects, loading: subjectsLoading, refetch: refetchSubjects } = useApi<ExamSubject[]>(`/api/exams/${examId}/subjects`);
  const { data: sections, loading: sectionsLoading, refetch: refetchSections } = useApi<ExamSection[]>(
    selectedSubject ? `/api/subjects/${selectedSubject.id}/sections` : '', 
    [selectedSubject?.id]
  );

  const handleSubjectClick = (subject: ExamSubject) => {
    setSelectedSubject(subject);
    setSyllabusText(subject.topics_syllabus || '');
  };

  const handleEditExam = () => {
    if (exam) {
      setExamFormData({
        start_date: exam.start_date.split('T')[0] + 'T' + exam.start_date.split('T')[1].substring(0, 5),
        end_date: exam.end_date.split('T')[0] + 'T' + exam.end_date.split('T')[1].substring(0, 5),
        duration_minutes: exam.duration_minutes,
      });
      setShowEditExam(true);
    }
  };

  const handleSaveExam = async () => {
    if (!exam) return;
    
    setIsSavingExam(true);
    try {
      await api.put(`/api/exams/${exam.id}`, {
        ...exam,
        start_date: new Date(examFormData.start_date).toISOString(),
        end_date: new Date(examFormData.end_date).toISOString(),
        duration_minutes: examFormData.duration_minutes,
      });
      
      refetchExam();
      setShowEditExam(false);
    } catch (error) {
      console.error('Failed to save exam details:', error);
    } finally {
      setIsSavingExam(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveSyllabus = async () => {
    if (!selectedSubject) return;
    
    setIsSavingSyllabus(true);
    try {
      await api.put(`/api/subjects/${selectedSubject.id}`, {
        ...selectedSubject,
        topics_syllabus: syllabusText,
      });
      
      // Update local state
      setSelectedSubject(prev => prev ? { ...prev, topics_syllabus: syllabusText } : null);
      refetchSubjects();
    } catch (error) {
      console.error('Failed to save syllabus:', error);
    } finally {
      setIsSavingSyllabus(false);
    }
  };

  const handleAddSection = async (sectionData: CreateSection) => {
    if (!selectedSubject) return;
    
    setSectionLoading(true);
    try {
      await api.post(`/api/subjects/${selectedSubject.id}/sections`, sectionData);
      refetchSections();
      setShowSectionModal(false);
    } catch (error) {
      console.error('Failed to add section:', error);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleQuestionClick = (questionNumber: number) => {
    navigate(`/exam/${examId}/question/${questionNumber}`);
  };

  if (examLoading || subjectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (!exam || !subjects) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Exam not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
                <p className="text-slate-600">Exam Setup & Management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Subjects</h2>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectClick(subject)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSubject?.id === subject.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-medium">{subject.name}</div>
                    <div className="text-sm text-slate-500">
                      Questions {subject.start_question} - {subject.end_question}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Exam Details Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Exam Details</h2>
                <button
                  onClick={handleEditExam}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Details
                </button>
              </div>
              
              {showEditExam ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={examFormData.start_date}
                        onChange={(e) => setExamFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={examFormData.end_date}
                        onChange={(e) => setExamFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={examFormData.duration_minutes}
                      onChange={(e) => setExamFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveExam}
                      disabled={isSavingExam}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {isSavingExam ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setShowEditExam(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Start Date</div>
                      <div className="font-medium text-slate-900">{formatDateTime(exam.start_date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">End Date</div>
                      <div className="font-medium text-slate-900">{formatDateTime(exam.end_date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Duration</div>
                      <div className="font-medium text-slate-900">{exam.duration_minutes} minutes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedSubject ? (
              <div className="space-y-6">
                {/* Subject Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedSubject.name}
                    </h2>
                    <span className="text-sm text-slate-500">
                      Questions {selectedSubject.start_question} - {selectedSubject.end_question}
                    </span>
                  </div>

                  {/* Topics/Syllabus */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Topics in Syllabus
                    </label>
                    <textarea
                      value={syllabusText}
                      onChange={(e) => setSyllabusText(e.target.value)}
                      className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Enter the topics covered in this exam for this subject..."
                    />
                    <div className="mt-2">
                      <button
                        onClick={handleSaveSyllabus}
                        disabled={isSavingSyllabus}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {isSavingSyllabus ? 'Saving...' : 'Save Topics'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Sections</h3>
                    <button
                      onClick={() => setShowSectionModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Section
                    </button>
                  </div>

                  {sectionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-slate-600 text-sm">Loading sections...</p>
                    </div>
                  ) : sections && sections.length > 0 ? (
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <div key={section.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-slate-900">{section.name}</h4>
                              <p className="text-sm text-slate-600">
                                Questions {section.question_start} - {section.question_end} • {section.question_type}
                              </p>
                              <p className="text-sm text-slate-500">
                                Min. to attempt: {section.min_questions_to_attempt}
                              </p>
                            </div>
                            <div className="text-right text-sm text-slate-600">
                              <div>Correct: +{section.marking_if_correct}</div>
                              <div>Incorrect: {section.marking_if_incorrect}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuestionClick(section.question_start)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit Questions
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                              <List className="w-3 h-3" />
                              View All
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-4">No sections created yet</p>
                      <button
                        onClick={() => setShowSectionModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Section
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Select a Subject</h3>
                <p className="text-slate-600">
                  Choose a subject from the left panel to manage its sections and questions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateSectionModal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        onSave={handleAddSection}
        loading={sectionLoading}
      />
    </div>
  );
}
