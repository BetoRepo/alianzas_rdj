import { useState, useEffect } from "react";
import { Home, BookOpen, Users, BarChart2, Award, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  role: string;
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ role, currentScreen, onNavigate, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const userMenuItems = [
    { id: "dashboard", label: "Mi Progreso", icon: <Home className="w-5 h-5" /> },
    { id: "catalogo", label: "Cursos", icon: <BookOpen className="w-5 h-5" /> },
    { id: "mis-cursos", label: "Insignias", icon: <Award className="w-5 h-5" /> },
    { id: "perfil", label: "Perfil", icon: <User className="w-5 h-5" /> },
  ];

  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart2 className="w-5 h-5" /> },
    { id: "catalogo", label: "Cursos", icon: <BookOpen className="w-5 h-5" /> },
    { id: "admin-cursos", label: "Gestionar Cursos", icon: <BookOpen className="w-5 h-5" /> },
    { id: "users", label: "Usuarios", icon: <Users className="w-5 h-5" /> },
    { id: "perfil", label: "Perfil", icon: <User className="w-5 h-5" /> },
  ];

  const menuItems = role === "admin" ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* ─── NAVEGACIÓN DE ESCRITORIO (SIDEBAR IZQUIERDA) ─── */}
      <aside
        className={`group/sidebar hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 z-40 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
        style={{
          background: "linear-gradient(180deg, #622599 0%, #4a1c75 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Logotipo superior + toggle */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #FBC02D, #f59e0b)", fontFamily: "Nunito, sans-serif" }}
            >
              S
            </div>
            {!collapsed && (
              <span className="font-black text-white tracking-tight text-base whitespace-nowrap" style={{ fontFamily: "Nunito, sans-serif" }}>
                Aula Virtual Scout
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            className="w-7 h-7 rounded-lg items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100 hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Lista de enlaces del menú */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all ${
                  collapsed ? "justify-center px-0 py-3" : "px-4 py-3"
                } ${
                  isActive
                    ? "text-white bg-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className={isActive ? "text-[#FBC02D]" : "text-white/50"}>
                  {item.icon}
                </div>
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Botón de salir al fondo */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onLogout}
            title={collapsed ? "Cerrar Sesión" : undefined}
            aria-label="Cerrar Sesión"
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold text-white/50 hover:text-[#FBC02D] hover:bg-white/10 transition-all ${
              collapsed ? "justify-center px-0 py-3" : "px-4 py-3"
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ─── NAVEGACIÓN MÓVIL (BARRA INFERIOR / BOTTOM NAV) ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t z-40 flex items-center justify-around px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]"
        style={{
          background: "linear-gradient(180deg, #622599 0%, #4a1c75 100%)",
          borderColor: "rgba(255,255,255,0.1)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {menuItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 min-w-[64px] py-1 rounded-xl transition-colors ${
                isActive ? "text-[#FBC02D] font-extrabold" : "text-white/50 font-medium"
              }`}
            >
              <div className={isActive ? "scale-110 text-[#FBC02D] transition-transform" : "text-white/50"}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-0.5 min-w-[64px] py-1 text-white/50 hover:text-[#FBC02D]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Salir</span>
        </button>
      </nav>
    </>
  );
}
