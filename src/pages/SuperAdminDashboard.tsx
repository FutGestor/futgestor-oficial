import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    Headphones,
    BarChart3,
    Users,
    ShieldAlert,
    Megaphone,
    ArrowRight,
    ArrowLeft,
    Heart
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


import { useTodosChamados } from "@/hooks/useChamados";

export default function SuperAdminDashboard() {
    const { isSuperAdmin, isLoading, profile } = useAuth();
    const navigate = useNavigate();
    const { data: chamados } = useTodosChamados();

    const { data: teamData } = useQuery({
        queryKey: ["team-slug", profile?.team_id],
        enabled: !!profile?.team_id,
        queryFn: async () => {
            const { data } = await supabase
                .from("teams")
                .select("slug")
                .eq("id", profile!.team_id!)
                .maybeSingle();
            return data;
        }
    });

    if (isLoading) return null;
    if (!isSuperAdmin) return <Navigate to="/" replace />;
    
    const chamadosAbertos = chamados?.filter(c => c.status === "aberto").length || 0;

    const modules = [
        {
            title: "Vendas SaaS",
            description: "Acompanhe faturamento, planos ativos e transações financeiras globais.",
            icon: TrendingUp,
            path: "/super-admin/vendas",
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            title: "Suporte Global",
            description: "Gerencie chamados de suporte de todos os times e usuários da plataforma.",
            icon: Headphones,
            path: "/super-admin/suporte",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            badge: chamadosAbertos > 0 ? chamadosAbertos : undefined
        },
        {
            title: "Status do Sistema",
            description: "Monitore tráfego, performance e estado da infraestrutura (Vercel/Supabase).",
            icon: BarChart3,
            path: "/super-admin/status",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            title: "Controle de Usuários",
            description: "Gestão completa de perfis, permissões e aprovações de novos cadastros.",
            icon: Users,
            path: "/super-admin/usuarios",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            disabled: false
        },
        {
            title: "Avisos Globais",
            description: "Envie comunicados e avisos que aparecem para todos os usuários da plataforma.",
            icon: Megaphone,
            path: "/super-admin/avisos",
            color: "text-red-500",
            bg: "bg-red-500/10"
        },
        {
            title: "Saúde dos Clubes",
            description: "Análise de engajamento e risco de cancelamento (churn) baseado na atividade.",
            icon: Heart,
            path: "/super-admin/health",
            color: "text-pink-500",
            bg: "bg-pink-500/10"
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-[#0A1628]">
                <div className="container py-8 px-4 md:px-6">
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                <ShieldAlert className="h-5 w-5 text-[#D4A84B]" />
                                <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px]">Painel Master</p>
                            </div>
                            <h1 className="text-4xl font-bold text-white tracking-tight">Área do SuperAdmin</h1>
                            <p className="text-gray-400 mt-2">Visão geral e ferramentas de gestão da plataforma FutGestor.</p>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => {
                                const slug = teamData?.slug;
                                navigate(slug ? `/time/${slug}` : "/auth");
                            }}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-fit self-center md:self-auto"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar ao Site
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {modules.map((module) => (
                            <Card
                                key={module.title}
                                className={cn(
                                    "bg-[#0F2440] border-white/[0.06] hover:bg-[#152e50] transition-all cursor-pointer group",
                                    module.disabled && "opacity-50 cursor-not-allowed grayscale"
                                )}
                                onClick={() => !module.disabled && navigate(module.path)}
                            >
                                <CardHeader>
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", module.bg)}>
                                        <module.icon className={cn("h-6 w-6", module.color)} />
                                    </div>
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {module.title}
                                            {(module as any).badge && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-sm ring-1 ring-white/20 animate-in zoom-in duration-300">
                                                    {(module as any).badge}
                                                </span>
                                            )}
                                        </div>
                                        {!module.disabled && <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />}
                                    </CardTitle>
                                    <CardDescription className="text-gray-400 text-sm leading-relaxed">
                                        {module.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {module.disabled ? (
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-gray-500 border-gray-500/30">Em Breve</Badge>
                                    ) : (
                                        <Button variant="link" className="px-0 text-[#D4A84B] font-bold h-auto hover:no-underline group-hover:translate-x-1 transition-transform">
                                            Acessar Módulo
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/10 border border-white/5">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            🖥️ Dica de Gestão
                        </h3>
                        <p className="text-sm text-gray-400">
                            Como SuperAdmin, você tem acesso total a todos os dados. Utilize estas ferramentas com cautela, pois qualquer alteração aqui reflete instantaneamente em toda a plataforma para todos os times e jogadores.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
