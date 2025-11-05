import { useState } from 'react';
import { Sparkles, BookOpen, TrendingUp, Zap, Target } from 'lucide-react';
import AIChatbot from '../components/AIChatbot';

export default function AIAssistant() {
  const [sessionId] = useState(`session_${Date.now()}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Study Assistant
              </h1>
              <p className="text-slate-600">Get instant help with your exam preparation</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Panel - 3 cols */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
              <AIChatbot sessionId={sessionId} />
            </div>
          </div>

          {/* Info Panel - 1 col */}
          <div className="space-y-6">
            {/* Features */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Features</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-slate-700">AI-powered explanations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-slate-700">Answers from your question bank</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-slate-700">Concept clarification</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-orange-600" />
                  </div>
                  <span className="text-slate-700">Practice recommendations</span>
                </li>
              </ul>
            </div>

            {/* Example Questions */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg p-6">
              <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Try Asking:
              </h3>
              <div className="space-y-2">
                {[
                  "Explain Newton's laws",
                  "Give me calculus practice questions",
                  "What is the quadratic formula?",
                  "Help me understand thermodynamics",
                  "Show me chemistry MCQs"
                ].map((example, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-4 py-2.5 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-xl transition-all text-sm text-slate-700 hover:text-indigo-700 font-medium"
                    onClick={() => {
                      // Could auto-fill input with this question
                    }}
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 shadow-lg p-6">
              <h3 className="font-bold text-amber-900 mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-amber-900">
                <li>• Be specific in your questions</li>
                <li>• Ask for step-by-step solutions</li>
                <li>• Request practice questions</li>
                <li>• Mention your weak topics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

