"use client";

import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import { t } from "@/lib/i18n";

export function AppLoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-indigo-600/10 via-background to-background px-6">
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          {t("app.name")}
        </h1>
        <motion.div
          className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 10px 40px -10px rgba(99, 102, 241, 0.35)",
              "0 14px 50px -10px rgba(139, 92, 246, 0.4)",
              "0 10px 40px -10px rgba(99, 102, 241, 0.35)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Radar className="h-10 w-10" />
        </motion.div>
        <p className="text-center text-muted-foreground text-sm font-medium max-w-[260px] leading-relaxed">
          {t("app.loadingMessage")}
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-500"
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
