import { Instagram, MessageCircle, Youtube, Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import logoFutgestor from "@/assets/logo-futgestor.png";

export function Footer() {
  const { team } = useTeamConfig();

  const teamPrimaryColor = team.cores?.primary || "#0F2440";

  return (
    <footer 
      className="border-t border-border py-8"
      style={{ 
        backgroundColor: "hsl(var(--team-primary))",
        color: "hsl(var(--team-primary-foreground))"
      }}
    >
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
              <p className="font-bold" style={{ color: "inherit" }}>{team.nome}</p>
              <p className="text-sm opacity-70" style={{ color: "inherit" }}>
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
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10"
                style={{ color: "inherit" }}
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
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10"
                style={{ color: "inherit" }}
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
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10"
                style={{ color: "inherit" }}
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
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10"
                style={{ color: "inherit" }}
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-4 flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <p className="text-sm opacity-60" style={{ color: "inherit" }}>
            © {new Date().getFullYear()} {team.nome}. Todos os direitos
            reservados.
          </p>
          <Link to="/site" className="text-sm opacity-60 hover:opacity-100 transition-colors" style={{ color: "inherit" }}>
            Conheça o FutGestor
          </Link>
        </div>
      </div>
    </footer>
  );
}
