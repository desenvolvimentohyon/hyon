import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, User, ClipboardList, Settings, Home, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div 
        className="w-full max-w-[640px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Comandos Globais" className="flex h-full w-full flex-col overflow-hidden rounded-xl">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              autoFocus
              placeholder="O que você está procurando?"
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm">Nenhum resultado encontrado.</Command.Empty>
            
            <Command.Group heading="Navegação" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => navigate("/"))}
                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>D
                </kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/clientes"))}
                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Clientes</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/tarefas"))}
                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                <span>Tarefas</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/financeiro"))}
                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Calculator className="mr-2 h-4 w-4" />
                <span>Financeiro</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="-mx-1 h-px bg-border" />

            <Command.Group heading="Configurações" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => navigate("/configuracoes"))}
                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações do Sistema</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>S
                </kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
