import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

const BACKGROUNDS: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000", // Estádio Gramado Noite
  agenda: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000", // Arquibancada Premium
  jogos: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2000", // Bola Gramado Close
  financeiro: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000", // Modern Stadium Lights
  escalacao: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000", // Stadium Lights (Proven stable ID)
  jogadores: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000", // Players Training
  ranking: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000", // Reutilizando Estádio Gramado Noite (Garantido)
  ligas: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000", // Reuse working Stadium Night
  auth: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2000", // Night Stadium
};

export function DynamicBackground() {
  const location = useLocation();
  const [bgInfo, setBgInfo] = useState({
    url: BACKGROUNDS.default,
    hasError: false,
    loading: true
  });
  
  const preloadRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const bgKey = Object.keys(BACKGROUNDS).find(key => path.includes(key)) || "default";
    const targetUrl = BACKGROUNDS[bgKey];

    // Se a URL for a mesma e já carregou ou deu erro, não faz nada
    if (targetUrl === bgInfo.url && !bgInfo.loading) return;

    setBgInfo(prev => ({ ...prev, loading: true, hasError: false }));

    const img = new Image();
    img.src = targetUrl;
    preloadRef.current = img;

    img.onload = () => {
      setBgInfo({
        url: targetUrl,
        loading: false,
        hasError: false
      });
    };

    img.onerror = () => {
      console.warn(`[DynamicBackground] Falha ao carregar asset: ${targetUrl}. Aplicando fallback.`);
      setBgInfo({
        url: targetUrl,
        loading: false,
        hasError: true
      });
    };

    return () => {
      if (preloadRef.current) {
        preloadRef.current.onload = null;
        preloadRef.current.onerror = null;
      }
    };
  }, [location.pathname, bgInfo.url, bgInfo.loading]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#020408]">
      {/* Fallback Layer: Gradiente Azul/Verde Escuro Premium - Mais visível */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e25] via-[#040810] to-[#0d2a52]" />
      
      <AnimatePresence mode="wait">
        {!bgInfo.hasError && !bgInfo.loading && (
          <motion.div
            key={bgInfo.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${bgInfo.url}')` }}
          />
        )}
      </AnimatePresence>
      
      {/* Overlay de Degradê suavizado (Máscara de Contraste) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 pointer-events-none" />
    </div>
  );
}
