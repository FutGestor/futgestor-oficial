import { Instagram, MessageCircle, Youtube, Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import logoFutgestor from "@/assets/logo-futgestor.png";

export function Footer() {
  const { team } = useTeamConfig();

  const teamPrimaryColor = team.cores?.primary || "#0F2440";

  return (
    <footer className="relative mt-auto border-t border-white/5 bg-black/60 backdrop-blur-3xl py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo Section */}
          <div className="mb-10 flex flex-col items-center gap-4">
            <FutGestorLogo className="h-20 w-20 transition-transform hover:scale-105" showText textClassName="text-3xl md:text-4xl" />
            <div className="max-w-md">
              <p className="font-black uppercase italic tracking-widest text-primary text-lg">{team.nome}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2 opacity-50">
                Elite Performance & SaaS Solutions
              </p>
            </div>
          </div>

          {/* Social Icons - Premium Distribution */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-6">
            {[
              { id: 'instagram', icon: Instagram, link: team.redes_sociais.instagram },
              { id: 'youtube', icon: Youtube, link: team.redes_sociais.youtube },
              { id: 'facebook', icon: Facebook, link: team.redes_sociais.facebook },
              { id: 'whatsapp', icon: MessageCircle, link: team.redes_sociais.whatsapp }
            ].map((social) => {
              if (!social.link) return null;
              const Icon = social.icon;
              const href = social.id === 'whatsapp' 
                ? (social.link.startsWith('http') ? social.link : `https://${social.link}`)
                : social.link;

              return (
                <a
                  key={social.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 transition-all hover:bg-primary hover:border-primary hover:-translate-y-1 active:scale-95 shadow-xl"
                  title={social.id.charAt(0).toUpperCase() + social.id.slice(1)}
                >
                  <Icon className="h-6 w-6 text-white group-hover:text-white transition-colors" />
                  <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
          </div>

          {/* Bottom Bar - Elegant & Minimal */}
          <div className="w-full max-w-4xl border-t border-white/5 pt-10 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-center w-full break-words max-w-[250px] md:max-w-none">
              © {new Date().getFullYear()} {team.nome}. Corporativo Exclusivo.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
