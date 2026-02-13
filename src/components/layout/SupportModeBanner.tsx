import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { useToast } from "@/hooks/use-toast";

export function SupportModeBanner() {
    const { isImpersonating, stopImpersonating } = useAuth();
    const { team } = useOptionalTeamSlug() || { team: { nome: "FutGestor" } };
    const navigate = useNavigate();
    const { toast } = useToast();

    if (!isImpersonating) return null;

    const handleStopImpersonating = () => {
        stopImpersonating();
        navigate("/super-admin/usuarios");
        toast({
            title: "Modo Suporte Desativado",
            description: "Você voltou ao seu perfil de SuperAdmin.",
        });
    };

    return (
        <div className="w-full bg-[#D4A84B] py-2 px-4 flex items-center justify-between gap-4 z-[60] shadow-md animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1 rounded-full">
                    <ShieldAlert className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="text-[#0A1628] font-bold text-xs uppercase tracking-wider">Modo Suporte Ativado</span>
                    <p className="text-[#0A1628]/80 text-[10px] md:text-sm font-medium">
                        Visualizando como: <span className="font-bold underline">{team?.nome || "Time"}</span>
                    </p>
                </div>
            </div>
            <Button
                variant="ghost" 
                size="sm"
                onClick={handleStopImpersonating}
                className="bg-[#0A1628] text-white hover:bg-[#0A1628]/90 font-bold text-[10px] md:text-xs h-8 px-4 border-none"
            >
                <LogOut className="mr-2 h-3.w-3" />
                Sair do Modo Suporte
            </Button>
        </div>
    );
}
