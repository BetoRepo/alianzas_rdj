import { useState, useEffect, useRef } from "react";
import { Command } from "cmdk";
import { Search, BookOpen, User, Home, Award, Settings, X } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  role: string;
}

export function CommandPalette({ open, onClose, onNavigate, role }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onClose]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const focusableSelectors = 'input, button, [tabindex]:not([tabindex="-1"])';
    const modal = document.querySelector('[data-command-palette]');
    if (!modal) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = (modal as HTMLElement).querySelectorAll(focusableSelectors);
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open) return null;

  const userItems = [
    { id: "dashboard", label: "Mi Progreso", icon: <Home className="w-4 h-4" /> },
    { id: "catalogo", label: "Catálogo de Cursos", icon: <BookOpen className="w-4 h-4" /> },
    { id: "mis-cursos", label: "Mis Insignias", icon: <Award className="w-4 h-4" /> },
    { id: "perfil", label: "Mi Perfil", icon: <User className="w-4 h-4" /> },
  ];

  const adminItems = [
    { id: "dashboard", label: "Dashboard Admin", icon: <Settings className="w-4 h-4" /> },
    { id: "catalogo", label: "Catálogo de Cursos", icon: <BookOpen className="w-4 h-4" /> },
    { id: "admin-cursos", label: "Gestionar Cursos", icon: <BookOpen className="w-4 h-4" /> },
    { id: "users", label: "Usuarios", icon: <User className="w-4 h-4" /> },
    { id: "perfil", label: "Mi Perfil", icon: <User className="w-4 h-4" /> },
  ];

  const items = role === "admin" ? adminItems : userItems;

  return (
    <div className="fixed inset-0 z-50" data-command-palette role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-md">
        <Command className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar navegación..."
              aria-label="Buscar navegación"
              className="flex-1 py-3 text-sm outline-none bg-transparent"
            />
            <button onClick={onClose} aria-label="Cerrar paleta de comandos" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <Command.List className="max-h-64 overflow-auto p-2" role="listbox">
            <Command.Empty className="py-6 text-center text-xs text-gray-400">
              No se encontraron resultados
            </Command.Empty>
            {items.map((item) => (
              <Command.Item
                key={item.id}
                value={item.label}
                onSelect={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                role="option"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors data-[selected=true]:bg-[#622599]/10 data-[selected=true]:text-[#622599] text-gray-700 hover:bg-gray-50"
              >
                {item.icon}
                {item.label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
