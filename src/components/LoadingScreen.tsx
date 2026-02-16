import { motion } from "framer-motion";
import { FutGestorLogo } from "./FutGestorLogo";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl">
      <motion.div
        animate={{
          scale: [0.95, 1.05, 0.95],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center gap-8"
      >
        <FutGestorLogo className="h-28 w-28 md:h-36 md:w-36 filter drop-shadow-[0_0_20px_rgba(27,58,92,0.6)]" showText={true} textClassName="text-3xl md:text-5xl" />
        {message && (
          <p className="text-primary font-black uppercase italic tracking-[0.3em] animate-pulse text-sm md:text-base">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
