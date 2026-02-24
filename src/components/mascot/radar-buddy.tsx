"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Mood = "happy" | "excited" | "thinking" | "sad";
type Size = "sm" | "md" | "lg";

interface RadarBuddyProps {
  size?: Size;
  mood?: Mood;
  message?: string;
  className?: string;
}

const SIZES: Record<Size, number> = { sm: 64, md: 96, lg: 128 };

const MOUTH: Record<Mood, string> = {
  happy: "M 35,58 Q 40,64 45,58",
  excited: "M 33,56 Q 40,66 47,56",
  thinking: "M 37,59 Q 40,56 43,59",
  sad: "M 35,62 Q 40,56 45,62",
};

export function RadarBuddy({ size = "md", mood = "happy", message, className }: RadarBuddyProps) {
  const s = SIZES[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Antenna */}
          <motion.line
            x1="40" y1="8" x2="40" y2="18"
            stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "40px 18px" }}
          />
          <motion.circle
            cx="40" cy="6" r="3.5"
            fill="#818cf8"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Body */}
          <circle cx="40" cy="44" r="26" fill="url(#bodyGrad)" />
          <circle cx="40" cy="44" r="26" stroke="#818cf8" strokeWidth="2" opacity="0.3" />

          {/* Radar rings */}
          <motion.circle
            cx="40" cy="44" r="18"
            stroke="#818cf8" strokeWidth="1" fill="none" opacity="0.15"
            animate={{ r: [18, 22, 18], opacity: [0.15, 0.05, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="40" cy="44" r="10"
            stroke="#818cf8" strokeWidth="1" fill="none" opacity="0.2"
            animate={{ r: [10, 14, 10], opacity: [0.2, 0.08, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Eyes */}
          <motion.g
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
            style={{ transformOrigin: "40px 40px" }}
          >
            <ellipse cx="32" cy="40" rx="4" ry="4.5" fill="#312e81" />
            <ellipse cx="48" cy="40" rx="4" ry="4.5" fill="#312e81" />
            <circle cx="33.5" cy="38.5" r="1.5" fill="white" opacity="0.8" />
            <circle cx="49.5" cy="38.5" r="1.5" fill="white" opacity="0.8" />
          </motion.g>

          {/* Radar eye highlight */}
          <motion.circle
            cx="48" cy="40" r="6"
            fill="none" stroke="#6366f1" strokeWidth="1.5"
            opacity="0.4"
            animate={{ r: [6, 8, 6], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Mouth */}
          <path d={MOUTH[mood]} stroke="#312e81" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Cheeks (blush) */}
          <circle cx="26" cy="48" r="4" fill="#fda4af" opacity="0.3" />
          <circle cx="54" cy="48" r="4" fill="#fda4af" opacity="0.3" />

          {/* Gradient defs */}
          <defs>
            <radialGradient id="bodyGrad" cx="0.4" cy="0.35" r="0.6">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-xl max-w-[200px] text-center relative"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-50 rotate-45" />
          {message}
        </motion.div>
      )}
    </div>
  );
}
