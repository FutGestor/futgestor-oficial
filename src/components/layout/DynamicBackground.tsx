import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const BACKGROUNDS: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000", // Estádio Gramado Noite
  agenda: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000", // Arquibancada Premium
  jogos: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2000", // Bola Gramado Close
  financeiro: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000", // Stadium Lights
  escalacao: "https://images.unsplash.com/photo-1516733968668-dbdce39c46ef?q=80&w=2000", // Locker room / Stadium Tunnel
  jogadores: "https://images.unsplash.com/photo-1543351611-58f6a273b4d6?q=80&w=2000", // Vestiário Profissional
  ranking: "https://images.unsplash.com/photo-1431324155629-1a6eda1fed2e?q=80&w=2000", // Gramado Panorâmico
  ligas: "https://images.unsplash.com/photo-1518091044134-26d1edfe5dca?q=80&w=2000", // Atmosfera estádio
  auth: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2000", // Night Stadium
};

export function DynamicBackground() {
  const location = useLocation();
  const [currentBg, setCurrentBg] = useState(BACKGROUNDS.default);

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    // Procura por qualquer uma das chaves no path completo (mais robusto que .pop())
    const bgKey = Object.keys(BACKGROUNDS).find(key => path.includes(key)) || "default";
    const bg = BACKGROUNDS[bgKey];
    setCurrentBg(bg);
  }, [location]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#020408]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${currentBg}')` }}
        />
      </AnimatePresence>
      
      {/* Overlay de Degradê suavizado */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60 pointer-events-none" />
    </div>
  );
}
