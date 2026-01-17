import { motion } from "framer-motion";

const partners = [
  "MIT", "Stanford", "Harvard", "Cambridge", 
  "Oxford", "Princeton", "Yale", "Columbia"
];

export default function Stats() {
  return (
    <section className="py-12 bg-white border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
          Trusted by world-class institutions
        </p>
        
        {/* Simple Marquee Effect Container */}
        <div className="w-full relative flex overflow-hidden mask-fade-sides">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>

            <motion.div 
                className="flex gap-16 items-center whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{ 
                    repeat: Infinity, 
                    duration: 30, 
                    ease: "linear" 
                }}
            >
                {[...partners, ...partners, ...partners].map((partner, i) => (
                    <div key={i} className="text-xl md:text-2xl font-bold text-gray-300 font-serif italic hover:text-blue-900 transition-colors cursor-default">
                        {partner}
                    </div>
                ))}
            </motion.div>
        </div>
      </div>
    </section>
  );
}
