import { Instagram } from "lucide-react";
import escudo from "@/assets/escudo-real-tralhas.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary py-8">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src={escudo}
              alt="Real Tralhas"
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="font-bold text-primary-foreground">Real Tralhas</p>
              <p className="text-sm text-primary-foreground/70">
                Time de Futebol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/real_tralhas2025"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Instagram className="h-5 w-5" />
              @real_tralhas2025
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-4 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Real Tralhas. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
