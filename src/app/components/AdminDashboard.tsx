import { useState, useEffect } from "react";
import { Users, CheckCircle, UserPlus, TrendingUp, BarChart2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getMetrics() {
      // Cuenta en tiempo real la cantidad exacta de filas en tus tablas
      const { count: usersCount } = await supabase.from("perfiles").select("*", { count: 'exact', head: true });
      const { count: coursesCount } = await supabase.from("cursos").select("*", { count: 'exact', head: true });
      
      setTotalUsers(usersCount || 0);
      setTotalCourses(coursesCount || 0);
      setLoading(false);
    }
    getMetrics();
  }, []);

  const stats = [
    { label: "Usuarios Activos", value: loading ? "..." : totalUsers.toString(), trend: "Base de Datos", icon: <Users className="w-5 h-5" />, color: "#7c3aed", bg: "#f3f0ff" },
    { label: "Cursos Publicados", value: loading ? "..." : totalCourses.toString(), trend: "Global", icon: <BarChart2 className="w-5 h-5" />, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Nuevas Inscripciones", value: "0", trend: "7 días", icon: <UserPlus className="w-5 h-5" />, color: "#0ea5e9", bg: "#f0f9ff" },
    { label: "Tasa de Completado", value: "100%", trend: "Estable", icon: <TrendingUp className="w-5 h-5" />, color: "#f59e0b", bg: "#fffbeb" },
  ];

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div>
        <p className="text-sm text-gray-500">Panel de control</p>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>Dashboard Administrativo</h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border" style={{ borderColor: "rgba(91,33,182,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.trend}</span>
            </div>
            <div className="text-2xl font-black text-gray-900" style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}