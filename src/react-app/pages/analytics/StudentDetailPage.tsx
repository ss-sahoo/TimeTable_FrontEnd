import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, Phone, Clock, Award, AlertTriangle,
  CheckCircle, XCircle, MinusCircle, BarChart3, FileText, Calendar,
  Shield, TrendingUp
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernCard from '@/react-app/components/analytics/ModernCard';
import ModernTabs from '@/react-app/components/analytics/ModernTabs';
import ProgressRing from '@/react-app/components/analytics/ProgressRing';

interface StudentAttemptDetail {
  attempt_id: number;
  student: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  exam: {
    id: number;
    title: string;
    total_questions: number;
    total_marks: number;
  };
  score: number;
  percentage: number;
  time_spent: number;
  started_at: string;
  submitted_at: string;
  status: string;
  violations_count: number;
  violations: Array<{
    type: string;
    timestamp: string;
    description: string;
  }>;
  question_responses: Array<{
    question_number: number;
    question_text: string;
    question_type: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    is_answered: boolean;
    marks_obtained: number;
    max_marks: number;
    time_spent: number;
  }>;
  section_scores: Record<string, {
    section_name: string;
    subject: string;
    score: number;
    max_marks: number;
    correct: number;
    wrong: number;
    unattempted: number;
  }>;
}

export default function StudentDetailPage() {
  const { examId, studentId } = useParams<{ examId: string; studentId: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<StudentAttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'violations'>('overview');

  useEffect(() => {
    if (examId && studentId) {
      loadStudentDetail();
    }
  }, [examId, studentId]);

  const loadStudentDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/student-result/${studentId}/`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getPerformanceColor = (percentage: number): 'emerald' | 'blue' | 'amber' | 'rose' => {
    if (percentage >= 80) return 'emerald';
    if (percentage >= 60) return 'blue';
    if (percentage >= 40) return 'amber';
    return 'rose';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium">Loading student details...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-rose-200 p-8 max-w-md text-center shadow-xl"
        >
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Data</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const totalCorrect = data.question_responses?.filter(q => q.is_correct).length || 0;
  const totalWrong = data.question_responses?.filter(q => !q.is_correct && q.is_answered).length || 0;
  const totalUnattempted = data.question_responses?.filter(q => !q.is_answered).length || 0;
  const perfColor = getPerformanceColor(data.percentage);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'questions', label: 'Questions', icon: FileText },
    { id: 'violations', label: 'Violations', icon: AlertTriangle, badge: data.violations_count },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard padding="md">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/exams/${examId}/results-analytics/students`)}
                className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors self-start"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/30">
                    {data.student.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{data.student.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {data.student.email}
                      </span>
                      {data.student.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {data.student.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="md:ml-auto flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">{data.exam.title}</p>
                    <p className={`text-3xl font-bold text-${perfColor}-600`}>
                      {data.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <ProgressRing
                    value={data.percentage}
                    size={70}
                    strokeWidth={6}
                    color={perfColor}
                    showValue={false}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Score Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ModernCard
            title="Score"
            value={`${data.score.toFixed(1)}/${data.exam.total_marks}`}
            icon={Award}
            gradient="blue"
            size="sm"
          />
          <ModernCard
            title="Correct"
            value={totalCorrect}
            icon={CheckCircle}
            gradient="emerald"
            size="sm"
          />
          <ModernCard
            title="Wrong"
            value={totalWrong}
            icon={XCircle}
            gradient="rose"
            size="sm"
          />
          <ModernCard
            title="Skipped"
            value={totalUnattempted}
            icon={MinusCircle}
            gradient="amber"
            size="sm"
          />
          <ModernCard
            title="Time"
            value={formatTime(data.time_spent)}
            icon={Clock}
            gradient="purple"
            size="sm"
          />
        </div>

        {/* Tabs */}
        <GlassCard>
          <div className="mb-6">
            <ModernTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as typeof activeTab)}
              variant="underline"
            />
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Section-wise Performance */}
                {data.section_scores && Object.keys(data.section_scores).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Section-wise Performance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(data.section_scores).map(([sectionId, section], index) => {
                        const sectionPercentage = (section.score / section.max_marks) * 100;
                        const sectionColor = getPerformanceColor(sectionPercentage);
                        return (
                          <motion.div
                            key={sectionId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-slate-900">{section.section_name}</h4>
                                <p className="text-xs text-slate-500">{section.subject}</p>
                              </div>
                              <ProgressRing
                                value={sectionPercentage}
                                size={50}
                                strokeWidth={4}
                                color={sectionColor}
                              />
                            </div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-slate-600">Score</span>
                              <span className="font-semibold text-slate-900">
                                {section.score.toFixed(1)}/{section.max_marks}
                              </span>
                            </div>
                            <div className="flex gap-3 text-xs">
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {section.correct}
                              </span>
                              <span className="text-rose-600 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> {section.wrong}
                              </span>
                              <span className="text-slate-500 flex items-center gap-1">
                                <MinusCircle className="w-3 h-3" /> {section.unattempted}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Exam Timeline
                  </h3>
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Started:</span>
                      <span className="font-medium text-slate-900">{data.started_at ? formatDate(data.started_at) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-600">Submitted:</span>
                      <span className="font-medium text-slate-900">{data.submitted_at ? formatDate(data.submitted_at) : '-'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {data.question_responses?.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No question data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.question_responses?.map((q, index) => (
                      <motion.div
                        key={q.question_number}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`
                          p-4 rounded-xl border transition-colors
                          ${!q.is_answered 
                            ? 'bg-slate-50 border-slate-200' 
                            : q.is_correct 
                              ? 'bg-emerald-50 border-emerald-200' 
                              : 'bg-rose-50 border-rose-200'
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                            ${!q.is_answered 
                              ? 'bg-slate-200 text-slate-600' 
                              : q.is_correct 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-rose-500 text-white'
                            }
                          `}>
                            {q.question_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 mb-2">{q.question_text}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="text-slate-500">
                                Your answer: <span className="font-medium text-slate-700">{q.student_answer || '-'}</span>
                              </span>
                              {!q.is_correct && q.is_answered && (
                                <span className="text-emerald-600">
                                  Correct: <span className="font-medium">{q.correct_answer}</span>
                                </span>
                              )}
                              <span className={`font-medium ${q.marks_obtained > 0 ? 'text-emerald-600' : q.marks_obtained < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                {q.marks_obtained > 0 ? '+' : ''}{q.marks_obtained.toFixed(2)}/{q.max_marks} marks
                              </span>
                              <span className="text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(q.time_spent)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {!q.is_answered ? (
                              <MinusCircle className="w-5 h-5 text-slate-400" />
                            ) : q.is_correct ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'violations' && (
              <motion.div
                key="violations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {data.violations_count === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-slate-600 font-medium">No violations recorded</p>
                    <p className="text-sm text-slate-400 mt-1">This student completed the exam without any issues</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.violations?.map((violation, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-rose-50 border border-rose-200 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-rose-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-rose-900">{violation.type}</p>
                            <p className="text-sm text-rose-700 mt-1">{violation.description}</p>
                            <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(violation.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
}
