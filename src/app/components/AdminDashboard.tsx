import { useState, useEffect } from "react";
import { Users, CheckCircle, UserPlus, BarChart2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<{ users: number; courses: number; newUsers: number; completed: number } | null>(null);

  useEffect(() => {
    async function getMetrics() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      // Conteos exactos sin descargar filas, en paralelo
      const [users, courses, newUsers, completed] = await Promise.all([
        supabase.from("perfiles").select("id", { count: "exact", head: true }),
        supabase.from("cursos").select("id", { count: "exact", head: true }),
        supabase.from("perfiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("progreso_modulo").select("id", { count: "exact", head: true }).eq("completado", true)
      ]);
      setMetrics({
        users: users.count || 0,
        courses: courses.count || 0,
        newUsers: newUsers.count || 0,
        completed: completed.count || 0
      });
    }
    void getMetrics();
  }, []);

  const show = (n: number | undefined) => (metrics ? String(n) : "...");
  const stats = [
    { label: "Usuarios Registrados", value: show(metrics?.users), trend: "Total", icon: <Users className="w-5 h-5" />, color: "#622599", bg: "#f3f0ff" },
    { label: "Cursos Publicados", value: show(metrics?.courses), trend: "Total", icon: <BarChart2 className="w-5 h-5" />, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Nuevos Usuarios", value: show(metrics?.newUsers), trend: "7 días", icon: <UserPlus className="w-5 h-5" />, color: "#0ea5e9", bg: "#f0f9ff" },
    { label: "Módulos Completados", value: show(metrics?.completed), trend: "Total", icon: <CheckCircle className="w-5 h-5" />, color: "#f59e0b", bg: "#fffbeb" },
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