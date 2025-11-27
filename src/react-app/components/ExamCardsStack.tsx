import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  BarChart3, 
  Brain, 
  Clock, 
  Users,
  Sparkles,
  Shield
} from 'lucide-react';

interface ExamCard {
  id: number;
  title: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  stats: { label: string; value: string }[];
}

const examCards: ExamCard[] = [
  {
    id: 1,
    title: 'Physics Final',
    icon: Brain,
    gradient: 'from-sky-500/90 to-blue-600/90',
    iconColor: 'text-sky-300',
    stats: [
      { label: 'Questions', value: '50' },
      { label: 'Duration', value: '2h' },
    ],
  },
  {
    id: 2,
    title: 'Math Quiz',
    icon: BarChart3,
    gradient: 'from-violet-500/90 to-purple-600/90',
    iconColor: 'text-violet-300',
    stats: [
      { label: 'Questions', value: '30' },
      { label: 'Duration', value: '1h' },
    ],
  },
  {
    id: 3,
    title: 'Chemistry Test',
    icon: FileText,
    gradient: 'from-pink-500/90 to-rose-600/90',
    iconColor: 'text-pink-300',
    stats: [
      { label: 'Questions', value: '40' },
      { label: 'Duration', value: '1.5h' },
    ],
  },
  {
    id: 4,
    title: 'Biology Exam',
    icon: Shield,
    gradient: 'from-emerald-500/90 to-teal-600/90',
    iconColor: 'text-emerald-300',
    stats: [
      { label: 'Questions', value: '45' },
      { label: 'Duration', value: '2h' },
    ],
  },
];

function GlassCard({ 
  card, 
  index, 
  isHovered,
  totalCards 
}: { 
  card: ExamCard; 
  index: number;
  isHovered: boolean;
  totalCards: number;
}) {
  const Icon = card.icon;
  const baseDelay = index * 0.15;
  
  // Calculate position in stack
  const stackOffset = index * 25;
  const rotateY = (index - 1.5) * 8;
  const rotateX = index * 2;
  const scale = 1 - (index * 0.05);
  const zIndex = totalCards - index;

  return (
    <motion.div
      className="absolute"
      initial={{ 
        opacity: 0, 
        y: 100,
        rotateY: -30,
        rotateX: 10,
      }}
      animate={{ 
        opacity: 1,
        y: 0,
        x: isHovered ? (index - 1.5) * 120 : stackOffset,
        rotateY: isHovered ? 0 : rotateY,
        rotateX: isHovered ? 0 : rotateX,
        scale: isHovered ? 1 : scale,
        z: isHovered ? 0 : -index * 30,
      }}
      transition={{ 
        delay: baseDelay,
        duration: 0.6,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.05,
        rotateY: 5,
        z: 50,
        transition: { duration: 0.3 }
      }}
      style={{ 
        zIndex,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Glassmorphism Card */}
      <div 
        className={`
          w-56 h-72 rounded-2xl overflow-hidden
          backdrop-blur-xl bg-gradient-to-br ${card.gradient}
          border border-white/20
          shadow-2xl
        `}
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 0 40px -10px rgba(139, 92, 246, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.2)
          `,
        }}
      >
        {/* Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
        
        {/* Content */}
        <div className="relative p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl bg-white/20 backdrop-blur-sm ${card.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: baseDelay + 0.5, type: 'spring' }}
            >
              <CheckCircle className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
            </motion.div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
          
          {/* Fake Question Lines */}
          <div className="space-y-2 mb-4 flex-1">
            <div className="h-2 bg-white/20 rounded-full w-full" />
            <div className="h-2 bg-white/15 rounded-full w-4/5" />
            <div className="h-2 bg-white/15 rounded-full w-3/5" />
            
            {/* Answer Options */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {['A', 'B', 'C', 'D'].map((opt, i) => (
                <motion.div
                  key={opt}
                  className={`h-6 rounded-lg flex items-center justify-center text-xs font-medium
                    ${i === 0 ? 'bg-emerald-400/30 text-emerald-200 border border-emerald-400/50' : 'bg-white/10 text-white/60'}
                  `}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: baseDelay + 0.3 + i * 0.1 }}
                >
                  {opt}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-white/20">
            {card.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
            <div className="flex items-center gap-1 text-white/60">
              <Users className="w-4 h-4" />
              <span className="text-xs">120</span>
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            delay: baseDelay,
          }}
          style={{ transform: 'skewX(-20deg)' }}
        />
      </div>
    </motion.div>
  );
}

// Floating particles
function FloatingParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-sky-400/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 ${p.size * 3}px rgba(56, 189, 248, 0.5)`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function ExamCardsStack() {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate cards
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % examCards.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div 
      className="relative w-full h-full flex items-start justify-center pt-16"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: '1200px' }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Cards Container */}
      <div 
        className="relative"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: 'rotateX(5deg)',
        }}
      >
        <AnimatePresence>
          {examCards.map((card, index) => (
            <GlassCard
              key={card.id}
              card={card}
              index={index}
              isHovered={isHovered}
              totalCards={examCards.length}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Stats Bar */}
      <motion.div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-white/80">AI-Powered</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="text-sm text-white/80">Real-time</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-white/80">Secure</span>
        </div>
      </motion.div>
    </div>
  );
}
