/**
 * SplashScreen - Reusable loading component with soccer theme
 * Use this for route transitions or data loading states
 */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Ball container with bounce animation */}
        <div className="relative w-20 h-24">
          {/* Soccer Ball SVG */}
          <svg 
            className="w-14 h-14 absolute left-1/2 -translate-x-1/2 animate-bounce"
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="48" fill="white" stroke="hsl(var(--primary))" strokeWidth="2"/>
            {/* Pentagon pattern */}
            <path d="M50 15L65 30L60 50L40 50L35 30Z" fill="hsl(var(--primary))"/>
            <path d="M75 45L85 55L75 75L60 70L60 50Z" fill="hsl(var(--primary))"/>
            <path d="M25 45L40 50L40 70L25 75L15 55Z" fill="hsl(var(--primary))"/>
            <path d="M35 80L40 70L60 70L65 80L50 90Z" fill="hsl(var(--primary))"/>
            {/* Connecting lines */}
            <path d="M35 30L15 40" stroke="hsl(var(--primary))" strokeWidth="2"/>
            <path d="M65 30L85 40" stroke="hsl(var(--primary))" strokeWidth="2"/>
            <path d="M60 50L75 45" stroke="hsl(var(--primary))" strokeWidth="2"/>
            <path d="M40 50L25 45" stroke="hsl(var(--primary))" strokeWidth="2"/>
            <path d="M40 70L35 80" stroke="hsl(var(--primary))" strokeWidth="2"/>
            <path d="M60 70L65 80" stroke="hsl(var(--primary))" strokeWidth="2"/>
          </svg>
          
          {/* Ball shadow */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-black/30 rounded-full"
            style={{ animation: 'shadow 0.6s ease-in-out infinite' }}
          />
        </div>
        
        {/* Field line */}
        <div className="relative w-28 h-0.5 bg-primary-foreground rounded-full">
          <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-2 h-2 bg-primary-foreground rounded-full" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-2 h-2 bg-primary-foreground rounded-full" />
        </div>
        
        {/* Loading text */}
        <span className="text-secondary text-sm font-medium tracking-widest uppercase animate-pulse">
          Carregando...
        </span>
      </div>
      
      {/* Shadow animation keyframes */}
      <style>{`
        @keyframes shadow {
          0%, 100% {
            transform: translateX(-50%) scale(0.7);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) scale(1);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
