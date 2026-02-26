"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadarBuddy } from "@/components/mascot/radar-buddy";
import { useAuth } from "@/components/auth/auth-provider";
import { LEVEL_THRESHOLDS } from "@/lib/constants";
import { t } from "@/lib/i18n";

const CONFETTI_COLORS = ["#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#3b82f6"];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = 10 + Math.random() * 80;
  const delay = Math.random() * 0.5;
  const duration = 1.5 + Math.random() * 1;
  const rotation = Math.random() * 360;
  const size = 6 + Math.random() * 6;

  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: 400,
        x: (Math.random() - 0.5) * 100,
        opacity: 0,
        rotate: rotation + 360,
        scale: 0.5,
      }}
      transition={{ duration, delay, ease: "easeOut" }}
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: 0,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      }}
    />
  );
}

export function LevelUpModal() {
  const { levelUp, dismissLevelUp } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (levelUp) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        dismissLevelUp();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [levelUp, dismissLevelUp]);

  const levelInfo = LEVEL_THRESHOLDS.find((t) => t.level === levelUp);

  return (
    <AnimatePresence>
      {visible && levelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => { setVisible(false); dismissLevelUp(); }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <RadarBuddy size="lg" mood="excited" className="mb-4" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-300/30"
            >
              <span className="text-2xl font-black text-white">{levelUp}</span>
            </motion.div>

            <h2 className="text-2xl font-extrabold mb-1">{t("levelUp.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("levelUp.description")} <span className="font-bold text-foreground">{t("levelUp.level")} {levelUp}</span>
              {levelInfo && <> — {levelInfo.label}</>}
            </p>

            <button
              onClick={() => { setVisible(false); dismissLevelUp(); }}
              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer"
            >
              {t("levelUp.dismiss")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
