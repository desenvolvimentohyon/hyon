import { Topbar } from "@/components/layout/Topbar";
import { ModuleNavBar } from "@/components/layout/ModuleNavBar";
import { Outlet, useLocation } from "react-router-dom";

import { PushNotificationBanner } from "@/components/PushNotificationBanner";
import { useApp } from "@/contexts/AppContext";
import { useUsers } from "@/contexts/UsersContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ROTA_PERMISSAO } from "@/types/users";
import AcessoNegado from "@/pages/AcessoNegado";

export function AppLayout() {
  const { loading } = useApp();
  const { hasPermission } = useUsers();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  // Check route permission
  const currentPath = location.pathname;
  const requiredPerm = ROTA_PERMISSAO[currentPath];
  const hasAccess = !requiredPerm || hasPermission(requiredPerm);

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Topbar />
      <PushNotificationBanner />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <ModuleNavBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto animate-fade-in gradient-bg">
          {hasAccess ? <Outlet /> : <AcessoNegado />}
        </main>
      </div>
    </div>
  );
}
