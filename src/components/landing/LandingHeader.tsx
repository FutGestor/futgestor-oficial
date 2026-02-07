import { useState } from "react";
import { Link } from "react-router-dom";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { Menu, X } from "lucide-react";

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  const scroll = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between bg-[#0A1628]/85 backdrop-blur-xl border-b border-gold/10">
      <Link to="/" className="flex items-center gap-2">
        <FutGestorLogo className="h-9 w-9" />
        <span className="font-display text-2xl tracking-widest text-white">
          Fut<span className="text-gold">Gestor</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        <button onClick={() => scroll("funcionalidades")} className="text-sm font-medium text-gray-300 hover:text-gold transition-colors">Funcionalidades</button>
        <button onClick={() => scroll("como-funciona")} className="text-sm font-medium text-gray-300 hover:text-gold transition-colors">Como funciona</button>
        <button onClick={() => scroll("precos")} className="text-sm font-medium text-gray-300 hover:text-gold transition-colors">Preços</button>
        <button onClick={() => scroll("faq")} className="text-sm font-medium text-gray-300 hover:text-gold transition-colors">FAQ</button>
        <button
          onClick={() => scroll("precos")}
          className="ml-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] shadow-[0_4px_20px_rgba(212,168,75,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(212,168,75,0.4)] transition-all"
        >
          Conhecer planos
        </button>
      </nav>

      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)} className="md:hidden text-white">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#0A1628]/95 backdrop-blur-xl border-b border-gold/10 flex flex-col gap-4 p-6 md:hidden">
          <button onClick={() => scroll("funcionalidades")} className="text-left text-sm text-gray-300 hover:text-gold">Funcionalidades</button>
          <button onClick={() => scroll("como-funciona")} className="text-left text-sm text-gray-300 hover:text-gold">Como funciona</button>
          <button onClick={() => scroll("precos")} className="text-left text-sm text-gray-300 hover:text-gold">Preços</button>
          <button onClick={() => scroll("faq")} className="text-left text-sm text-gray-300 hover:text-gold">FAQ</button>
          <button
            onClick={() => scroll("precos")}
            className="mt-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] w-full"
          >
            Conhecer planos
          </button>
        </div>
      )}
    </header>
  );
}
