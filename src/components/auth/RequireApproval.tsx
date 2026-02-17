import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function RequireApproval() {
    const { user, isApproved, isAdmin, isSuperAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Admins and Super Admins bypass the approval check
    if (!isApproved && !isAdmin && !isSuperAdmin) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4 text-center">
                <div className="mb-6 rounded-full bg-yellow-100 p-6 dark:bg-yellow-900/30">
                    <ShieldAlert className="h-12 w-12 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h1 className="mb-2 text-2xl font-bold">Aprovação Pendente</h1>
                <p className="mb-6 max-w-md text-muted-foreground">
                    Sua conta foi criada com sucesso, mas ainda precisa ser aprovada por um administrador do time para você ter acesso completo ao sistema.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair e Tentar Novamente
                    </Button>
                </div>
            </div>
        );
    }

    return <Outlet />;
}
