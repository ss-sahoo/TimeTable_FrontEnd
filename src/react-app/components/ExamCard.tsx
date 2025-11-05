import { useState } from 'react';
import { Clock, Calendar, BookOpen, MoreVertical, Link, Copy } from 'lucide-react';
import { Exam } from '@/shared/types';

interface ExamCardProps {
  exam: Exam;
  onClick: () => void;
}

export default function ExamCard({ exam, onClick }: ExamCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleGetExamLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLinkModal(true);
    setShowMenu(false);
  };

  const examLink = `${window.location.origin}/exam-view/${exam.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(examLink);
    // You could add a toast notification here
  };

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-xl border border-slate-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 group relative"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {exam.title}
              </h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  exam.status === 'preparing' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {exam.status === 'preparing' ? 'Preparing' : 'Prepared'}
                </span>
                
                <div className="relative">
                  <button
                    onClick={handleMenuClick}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                      <button
                        onClick={handleGetExamLink}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Link className="w-4 h-4" />
                        Get Exam Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(exam.start_date)} - {formatDate(exam.end_date)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{exam.duration_minutes} minutes</span>
              </div>
              
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Created {formatDate(exam.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Exam Link</h3>
            <p className="text-sm text-slate-600 mb-4">
              Share this link with students to give them access to the exam:
            </p>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg mb-4">
              <input
                type="text"
                value={examLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
              />
              <button
                onClick={copyLink}
                className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={copyLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
