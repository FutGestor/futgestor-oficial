import logoFutgestor from "@/assets/logo-futgestor.png";

interface FutGestorLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function FutGestorLogo({ className = "h-12 w-12", showText = false, textClassName }: FutGestorLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={logoFutgestor} alt="FutGestor" className={`${className} object-contain`} />
      {showText && (
        <span className={textClassName ?? "text-lg font-bold"}>FutGestor</span>
      )}
    </span>
  );
}
