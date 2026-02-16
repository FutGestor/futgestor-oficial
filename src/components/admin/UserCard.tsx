import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Clock, Shield, ShieldOff, Trash2, Pencil, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileWithEmail {
  id: string;
  nome: string | null;
  jogador_id: string | null;
  aprovado: boolean;
  created_at: string;
  team_id: string | null;
  email: string | null;
  plano: string | null;
  status_plano: string | null;
  jogador?: {
    nome: string;
    apelido: string | null;
  } | null;
  isAdmin?: boolean;
  teamName?: string;
}

interface UserCardProps {
  profile: ProfileWithEmail;
  isUpdating: string | null;
  isSuperAdmin: boolean;
  handleApprove?: (id: string) => void;
  handleReject?: (id: string) => void;
  handleToggleAdmin?: (id: string, current: boolean) => void;
  onEditName?: (user: ProfileWithEmail) => void;
  onUpdatePlan?: (user: ProfileWithEmail) => void;
  onDelete?: (user: ProfileWithEmail) => void;
}

export function UserCard({
  profile, isUpdating, isSuperAdmin, handleApprove, handleReject, handleToggleAdmin, onEditName, onUpdatePlan, onDelete
}: UserCardProps) {
  return (
    <Card key={profile.id}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="flex items-center gap-2">
            {!profile.aprovado ? (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Pendente
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="h-3 w-3" />
                Aprovado
              </Badge>
            )}
            {profile.isAdmin && (
              <Badge variant="secondary" className="gap-1 bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-[10px]">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
          <p className="mt-2 font-black uppercase italic tracking-tight text-white line-clamp-1">
            {profile.nome || profile.jogador?.apelido || profile.jogador?.nome || "Sem nome"}
          </p>
          {profile.email && (
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {profile.email}
            </p>
          )}
          <p className="text-sm font-semibold text-muted-foreground">
            Time: {profile.teamName || "Sem time"}
          </p>
          {profile.plano && (
            <Badge variant="outline" className={`mt-1 ${profile.status_plano === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
              Plano {profile.plano.toUpperCase()} • {profile.status_plano === 'active' ? 'Ativo' : 'Pendente'}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Desde {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          {!profile.aprovado ? (
            <>
              {!profile.nome && onEditName && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditName(profile)}
                  disabled={isUpdating === profile.id}
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Nome
                </Button>
              )}
              {handleApprove && (
                <Button
                  size="sm"
                  onClick={() => handleApprove(profile.id)}
                  disabled={isUpdating === profile.id}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Aprovar
                </Button>
              )}
            </>
          ) : (
            <>
              {profile.team_id && isSuperAdmin && onUpdatePlan && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-500 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                  onClick={() => onUpdatePlan(profile)}
                >
                  <CreditCard className="mr-1 h-4 w-4" />
                  Plano
                </Button>
              )}
              {!profile.nome && onEditName && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditName(profile)}
                  disabled={isUpdating === profile.id}
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Nome
                </Button>
              )}
              {isSuperAdmin && (
                <>
                  {handleToggleAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAdmin(profile.id, !!profile.isAdmin)}
                      disabled={isUpdating === profile.id}
                      title={profile.isAdmin ? "Remover Admin" : "Tornar Admin"}
                    >
                      {profile.isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </Button>
                  )}
                  {handleReject && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(profile.id)}
                      disabled={isUpdating === profile.id}
                      title="Rejeitar/Remover Acesso"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(profile)}
                      disabled={isUpdating === profile.id}
                      title="Excluir Permanentemente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
