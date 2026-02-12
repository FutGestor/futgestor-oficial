import { useState, useEffect } from "react";
import { Megaphone, X, AlertTriangle, Info, DollarSign, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Aviso = {
    id: string;
    titulo: string;
    conteudo: string;
    categoria: "geral" | "urgente" | "financeiro" | "jogo";
};

export function GlobalNoticeBanner() {
    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const fetchGlobalNotice = async () => {
            // Check if user dismissed a notice recently in this session
            const dismissedId = sessionStorage.getItem("dismissed_global_notice");

            const { data, error } = await supabase
                .from("avisos")
                .select("id, titulo, conteudo, categoria")
                .is("team_id", null)
                .eq("publicado", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!error && data && data.id !== dismissedId) {
                setAviso(data as Aviso);
            }
        };

        fetchGlobalNotice();
    }, []);

    const handleDismiss = () => {
        if (aviso) {
            sessionStorage.setItem("dismissed_global_notice", aviso.id);
        }
        setIsVisible(false);
        setIsDismissed(true);
    };

    if (!aviso || !isVisible || isDismissed) return null;

    const getIcon = () => {
        switch (aviso.categoria) {
            case "urgente": return <AlertTriangle className="h-4 w-4 text-white" />;
            case "financeiro": return <DollarSign className="h-4 w-4 text-white" />;
            case "jogo": return <Trophy className="h-4 w-4 text-white" />;
            default: return <Megaphone className="h-4 w-4 text-white" />;
        }
    };

    const getBgColor = () => {
        switch (aviso.categoria) {
            case "urgente": return "bg-red-600";
            case "financeiro": return "bg-green-600";
            case "jogo": return "bg-blue-600";
            default: return "bg-[#D4A84B]";
        }
    };

    return (
        <div className={cn(
            "w-full py-2 px-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-500",
            getBgColor()
        )}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 p-1 bg-white/20 rounded-full">
                    {getIcon()}
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 overflow-hidden">
                    <span className="text-white font-bold text-sm whitespace-nowrap">{aviso.titulo}:</span>
                    <p className="text-white/90 text-xs md:text-sm truncate">
                        {aviso.conteudo}
                    </p>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={handleDismiss}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
