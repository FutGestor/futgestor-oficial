import { Link } from "react-router-dom";
import { FutGestorLogo } from "@/components/FutGestorLogo";

export function LandingFooter() {
  return (
    <footer className="py-8 border-t border-white/5 bg-[#0A1628]">
      <div className="container flex flex-col items-center gap-4 px-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <FutGestorLogo className="h-8 w-8" />
          <span className="text-sm text-gray-500">
            © 2026 FutGestor. Todos os direitos reservados.
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link to="/site" className="text-gray-500 hover:text-gold transition-colors">
            Site
          </Link>
          <Link to="/auth" className="text-gray-500 hover:text-gold transition-colors">
            Login
          </Link>
          <Link to="/auth?tab=signup&redirect=onboarding" className="text-gray-500 hover:text-gold transition-colors">
            Cadastro
          </Link>
          <Link to="/termos" className="text-gray-500 hover:text-gold transition-colors">
            Termos de Uso
          </Link>
        </div>
      </div>
    </footer>
  );
}
