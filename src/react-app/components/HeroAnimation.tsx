import { motion } from 'framer-motion';
import { FileText, Brain, CheckCircle, Sparkles, Zap } from 'lucide-react';

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glowing Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex items-center gap-8">
        {/* PDF Document */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <motion.div
            className="w-44 h-56 bg-white rounded-lg shadow-2xl overflow-hidden"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* PDF Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-medium">exam.pdf</span>
            </div>
            
            {/* PDF Content */}
            <div className="p-3 space-y-2">
              <div className="h-2 bg-slate-200 rounded-full w-full" />
              <div className="h-2 bg-slate-200 rounded-full w-4/5" />
              <div className="h-2 bg-slate-200 rounded-full w-full" />
              <div className="mt-3 p-2 bg-slate-100 rounded">
                <div className="h-1.5 bg-slate-300 rounded-full w-3/4 mb-1.5" />
                <div className="flex gap-1">
                  <div className="h-1.5 bg-slate-200 rounded-full flex-1" />
                  <div className="h-1.5 bg-slate-200 rounded-full flex-1" />
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded-full w-full" />
              <div className="h-2 bg-slate-200 rounded-full w-2/3" />
            </div>

            {/* Scanning Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-sky-400/40 via-violet-400/30 to-transparent"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </motion.div>

        {/* Arrow 1 */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col items-center gap-1"
        >
          <motion.div
            className="w-16 h-1 bg-gradient-to-r from-sky-400 to-violet-400 rounded-full"
            animate={{ scaleX: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
          </motion.div>
        </motion.div>

        {/* AI Brain Center */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative"
        >
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 w-28 h-28 rounded-full border-4 border-dashed border-sky-400/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Ring */}
          <motion.div
            className="absolute inset-2 w-24 h-24 rounded-full border-4 border-dashed border-violet-400/40"
            style={{ top: '8px', left: '8px', width: '96px', height: '96px' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center Brain */}
          <motion.div
            className="w-28 h-28 bg-gradient-to-br from-sky-500 to-violet-600 rounded-full flex items-center justify-center shadow-2xl shadow-sky-500/50"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>

          {/* Sparkle Effects */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </motion.div>
          <motion.div
            className="absolute -bottom-1 -left-1"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <Zap className="w-4 h-4 text-sky-400" />
          </motion.div>
        </motion.div>

        {/* Arrow 2 */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-col items-center gap-1"
        >
          <motion.div
            className="w-16 h-1 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full"
            animate={{ scaleX: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
          </motion.div>
        </motion.div>

        {/* Question Cards Stack */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative w-48 h-56"
        >
          {/* Card 3 (back) */}
          <motion.div
            className="absolute top-8 left-4 w-40 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <QuestionCardContent num={3} />
          </motion.div>

          {/* Card 2 (middle) */}
          <motion.div
            className="absolute top-4 left-2 w-40 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-3 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 1 }}
          >
            <QuestionCardContent num={2} />
          </motion.div>

          {/* Card 1 (front) */}
          <motion.div
            className="absolute top-0 left-0 w-40 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-3 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, rotate: [0, 1, 0] }}
            transition={{ delay: 0.8, rotate: { duration: 3, repeat: Infinity } }}
          >
            <QuestionCardContent num={1} />
            <motion.div
              className="absolute -top-2 -right-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: "spring" }}
            >
              <CheckCircle className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Label */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <p className="text-slate-400 text-sm font-medium text-center">
          Upload PDF → AI Extracts → Ready Questions
        </p>
      </motion.div>
    </div>
  );
}

function QuestionCardContent({ num }: { num: number }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">Q{num}</span>
        </div>
        <div className="flex-1 h-1.5 bg-white/20 rounded-full" />
      </div>
      <div className="space-y-1">
        <div className="h-1.5 bg-white/30 rounded-full w-full" />
        <div className="h-1.5 bg-white/20 rounded-full w-4/5" />
        <div className="h-1.5 bg-white/20 rounded-full w-3/5" />
      </div>
      <div className="mt-2 flex gap-1">
        {['A', 'B', 'C', 'D'].map((opt) => (
          <div key={opt} className="flex-1 h-4 bg-white/15 rounded text-center text-white/70 text-[10px] flex items-center justify-center">
            {opt}
          </div>
        ))}
      </div>
    </>
  );
}
