import { Instagram, MessageCircle, Youtube, Facebook } from "lucide-react";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import logoFutgestor from "@/assets/logo-futgestor.png";

export function Footer() {
  const { team } = useTeamConfig();

  return (
    <footer className="border-t border-border bg-primary py-8">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            {team.escudo_url ? (
              <img
                src={team.escudo_url}
                alt={team.nome}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <img src={logoFutgestor} alt="FutGestor" className="h-10 w-10 object-contain" />
            )}
            <div>
              <p className="font-bold text-primary-foreground">{team.nome}</p>
              <p className="text-sm text-primary-foreground/70">
                Time de Futebol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {team.redes_sociais.instagram && (
              <a
                href={team.redes_sociais.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Instagram className="h-5 w-5" />
                Instagram
              </a>
            )}
            {team.redes_sociais.youtube && (
              <a
                href={team.redes_sociais.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Youtube className="h-5 w-5" />
                YouTube
              </a>
            )}
            {team.redes_sociais.facebook && (
              <a
                href={team.redes_sociais.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Facebook className="h-5 w-5" />
                Facebook
              </a>
            )}
            {team.redes_sociais.whatsapp && (
              <a
                href={team.redes_sociais.whatsapp.startsWith('http') ? team.redes_sociais.whatsapp : `https://${team.redes_sociais.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-4 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {team.nome}. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
