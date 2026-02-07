import { Link } from "react-router-dom";
import { FutGestorLogo } from "@/components/FutGestorLogo";

export function LandingFooter() {
  return (
    <footer className="border-t bg-primary py-8">
      <div className="container flex flex-col items-center gap-4 px-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <FutGestorLogo className="h-8 w-8" />
          <span className="text-sm text-primary-foreground/70">
            © 2026 FutGestor. Todos os direitos reservados.
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link to="/auth" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Login
          </Link>
          <Link to="/auth?tab=signup&redirect=onboarding" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Cadastro
          </Link>
          <Link to="/termos" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Termos de Uso
          </Link>
        </div>
      </div>
    </footer>
  );
}
