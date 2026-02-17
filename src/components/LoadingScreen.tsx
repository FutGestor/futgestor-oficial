import React from "react";
import { FutGestorLogo } from "./FutGestorLogo";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505]">
      {/* Background Glow Effect */}
      <div className="absolute h-[300px] w-[300px] bg-primary/20 blur-[100px] rounded-full animate-pulse" />
      
      {/* Animated Logo Container */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          {/* Subtle spinning ring behind logo */}
          <div className="absolute -inset-4 border-2 border-primary/10 border-t-primary/40 rounded-full animate-spin [animation-duration:3s]" />
          
          <div className="animate-pulse">
            <FutGestorLogo size="xl" className="drop-shadow-[0_0_20px_rgba(5,96,179,0.4)]" />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic animate-pulse">
            Carregando sua arena
          </p>
          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
}
