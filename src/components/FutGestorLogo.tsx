interface FutGestorLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

/**
 * FutGestor inline SVG logo — soccer ball with gear/cog.
 * No background, fully transparent, adapts to any surface.
 */
export function FutGestorLogo({ className = "h-12 w-12", showText = false, textClassName }: FutGestorLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        className={className}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gear / Cog behind the ball */}
        <g>
          {/* Gear teeth */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect
              key={angle}
              x="46"
              y="4"
              width="8"
              height="14"
              rx="2"
              fill="hsl(var(--primary))"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Gear body ring */}
          <circle cx="50" cy="50" r="38" stroke="hsl(var(--primary))" strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r="32" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" opacity="0.3" />
          {/* Gear bolt holes */}
          <circle cx="50" cy="16" r="2" fill="hsl(var(--primary))" opacity="0.5" />
          <circle cx="74" cy="26" r="2" fill="hsl(var(--primary))" opacity="0.5" />
          <circle cx="84" cy="50" r="2" fill="hsl(var(--primary))" opacity="0.5" />
          <circle cx="74" cy="74" r="2" fill="hsl(var(--primary))" opacity="0.5" />
        </g>

        {/* Soccer ball */}
        <circle cx="44" cy="48" r="26" fill="white" stroke="hsl(var(--primary))" strokeWidth="2" />
        {/* Pentagon patches */}
        <path d="M44 28L52 36L49 46L39 46L36 36Z" fill="hsl(var(--primary))" />
        <path d="M58 42L64 48L58 60L49 56L49 46Z" fill="hsl(var(--primary))" />
        <path d="M30 42L39 46L39 56L30 60L24 48Z" fill="hsl(var(--primary))" />
        <path d="M36 64L39 56L49 56L52 64L44 72Z" fill="hsl(var(--primary))" />
        {/* Connecting lines */}
        <path d="M36 36L24 40" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
        <path d="M52 36L64 40" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
        <path d="M39 56L36 64" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
        <path d="M49 56L52 64" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />

        {/* Motion swoosh lines */}
        <path d="M56 62C62 56 66 44 60 34" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M60 66C68 58 72 44 64 32" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      </svg>
      {showText && (
        <span className={textClassName ?? "text-lg font-bold"}>FutGestor</span>
      )}
    </span>
  );
}
