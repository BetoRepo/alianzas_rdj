import { Home, BookOpen, Users, BarChart2, Award, LogOut } from "lucide-react";

export default function Sidebar({ role, currentScreen, onNavigate, onLogout }) {
  
  // 1. Configuración de botones de navegación según tu App.tsx
  const userMenuItems = [
    { id: "dashboard", label: "Mi Progreso", icon: <Home className="w-5 h-5" /> },
    { id: "catalogo", label: "Cursos", icon: <BookOpen className="w-5 h-5" /> },
    { id: "mis-cursos", label: "Insignias", icon: <Award className="w-5 h-5" /> },
  ];

  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart2 className="w-5 h-5" /> },
    { id: "admin-cursos", label: "Gestionar Cursos", icon: <BookOpen className="w-5 h-5" /> },
    { id: "users", label: "Usuarios", icon: <Users className="w-5 h-5" /> },
  ];

  const menuItems = role === "admin" ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* ─── NAVEGACIÓN DE ESCRITORIO (SIDEBAR IZQUIERDA) ─── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r h-screen sticky top-0 flex-shrink-0"
             style={{ borderColor: "rgba(91,33,182,0.06)", fontFamily: "Inter, sans-serif" }}>
        
        {/* Logotipo superior */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(91,33,182,0.04)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                 style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", fontFamily: "Nunito, sans-serif" }}>
              S
            </div>
            <span className="font-black text-gray-900 tracking-tight text-base" style={{ fontFamily: "Nunito, sans-serif" }}>
              Aula Virtual Scout
            </span>
          </div>
        </div>

        {/* Lista de enlaces del menú */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive 
                          ? "text-purple-700 bg-purple-50/70 shadow-[0_4px_12px_rgba(124,58,237,0.05)]" 
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                      }`}>
                <div className={isActive ? "text-purple-600" : "text-gray-400"}>
                  {item.icon}
                </div>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Botón de salir al fondo */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(91,33,182,0.04)" }}>
          <button onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ─── NAVEGACIÓN MÓVIL (BARRA INFERIOR / BOTTOM NAV) ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex items-center justify-around px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]"
           style={{ borderColor: "rgba(91,33,182,0.08)", fontFamily: "Inter, sans-serif" }}>
        {menuItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
                    className={`flex flex-col items-center gap-0.5 min-w-[64px] py-1 rounded-xl transition-colors ${
                      isActive ? "text-purple-600 font-extrabold" : "text-gray-400 font-medium"
                    }`}>
              <div className={isActive ? "scale-110 text-purple-600 transition-transform" : "text-gray-400"}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
        {/* Botón Salir Móvil integrado en el navbar inferior */}
        <button onClick={onLogout} className="flex flex-col items-center gap-0.5 min-w-[64px] py-1 text-gray-400 hover:text-red-500">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Salir</span>
        </button>
      </nav>
    </>
  );
}