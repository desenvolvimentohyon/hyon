import { Topbar } from "@/components/layout/Topbar";
import { Outlet, useLocation } from "react-router-dom";
import { memo } from "react";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";
import { IAAssistant } from "@/features/ia/components/IAAssistant";
import { CommandMenu } from "@/shared/components/navigation/CommandMenu";

import { useApp } from "@/contexts/AppContext";
import { useUsers } from "@/contexts/UsersContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ROTA_PERMISSAO } from "@/types/users";
import AcessoNegado from "@/pages/AcessoNegado";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { motion, AnimatePresence } from "framer-motion";

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

export const AppLayout = memo(() => {
  const { loading } = useApp();
  const { hasPermission } = useUsers();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8 animate-pulse">
          <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-64 mx-auto rounded-lg" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const requiredPerm = ROTA_PERMISSAO[currentPath];
  const hasAccess = !requiredPerm || hasPermission(requiredPerm);

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden bg-background selection:bg-primary/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Topbar />
          <PushNotificationBanner />
          <main 
            className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto overflow-x-hidden gradient-bg min-w-0 scroll-smooth pb-24 sm:pb-8"
            style={{ 
              contain: 'content', 

              willChange: 'transform, opacity' 
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                {hasAccess ? <Outlet /> : <AcessoNegado />}
              </PageTransition>
            </AnimatePresence>
          </main>
          <IAAssistant />
          <CommandMenu />
        </div>

      </div>
    </SidebarProvider>
  );
});

AppLayout.displayName = "AppLayout";
