import { useState } from 'react';
import { Clock, Calendar, BookOpen, MoreVertical, Link, Copy } from 'lucide-react';
import { Exam } from '@/shared/types';
import { getExamViewLink } from '../utils/urlUtils';

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

  const examLink = getExamViewLink(exam.id);

  const copyLink = () => {
    navigator.clipboard.writeText(examLink);
    // You could add a toast notification here
  };

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 group relative"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {exam.title}
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${exam.status === 'preparing'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
                  }`}>
                  {exam.status === 'preparing' ? 'Preparing' : 'Prepared'}
                </span>

                <div className="relative">
                  <button
                    onClick={handleMenuClick}
                    className="p-1.5 sm:p-1 text-slate-400 hover:text-slate-600 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{formatDate(exam.start_date)} - {formatDate(exam.end_date)}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{exam.duration_minutes} minutes</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Created {formatDate(exam.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Exam Link</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
              Share this link with students to give them access to the exam:
            </p>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-slate-50 rounded-lg mb-3 sm:mb-4">
              <input
                type="text"
                value={examLink}
                readOnly
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-700 outline-none min-w-0"
              />
              <button
                onClick={copyLink}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowLinkModal(false)}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base order-2 sm:order-1"
              >
                Close
              </button>
              <button
                onClick={copyLink}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base order-1 sm:order-2"
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
