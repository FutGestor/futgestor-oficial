import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ManagementHeaderProps {
  title: string;
  subtitle?: string;
  backPath?: string;
}

export function ManagementHeader({ title, subtitle, backPath }: ManagementHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mb-8 flex flex-col gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-fit gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={handleBack}
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
