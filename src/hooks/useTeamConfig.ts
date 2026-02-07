import { useTimeCasa } from "@/hooks/useTimes";

export interface TeamConfig {
  nome: string;
  escudo_url: string | null;
  redes_sociais: {
    instagram?: string;
    whatsapp?: string;
    [key: string]: string | undefined;
  };
}

const DEFAULT_TEAM: TeamConfig = {
  nome: "Meu Time",
  escudo_url: null,
  redes_sociais: {},
};

export function useTeamConfig() {
  const { data: timeCasa, isLoading } = useTimeCasa();

  const team: TeamConfig = timeCasa
    ? {
        nome: timeCasa.nome,
        escudo_url: timeCasa.escudo_url,
        redes_sociais: (timeCasa as any).redes_sociais || {},
      }
    : DEFAULT_TEAM;

  return { team, isLoading };
}
