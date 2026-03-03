import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AcessoNegado() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <ShieldAlert className="h-16 w-16 text-destructive opacity-60" />
      <h1 className="text-2xl font-bold">Acesso Negado</h1>
      <p className="text-muted-foreground max-w-md">
        Você não tem permissão para acessar esta página. Entre em contato com o administrador para solicitar acesso.
      </p>
      <Button onClick={() => navigate("/")} variant="outline">Voltar ao Dashboard</Button>
    </div>
  );
}
