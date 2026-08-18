import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";

import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";

import { AdminDashboard } from "./components/AdminDashboard";
import { UsersScreen } from "./components/UsersScreen";

import AdminCursosScreen from "./components/AdminCursosScreen";
import UserDashboard from "./views/UserDashboard";
import CatalogoScreen from "./views/CatalogoScreen";
import CursoDetalleScreen from "./views/CourseDetailScreen";
import ModuleViewerScreen from "./views/ModuleViewerScreen";
import ProfileScreen from "./views/ProfileScreen";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase.from("perfiles").select("*").eq("id", userId).single();
    if (!error && data) {
      setProfile(data);
    } else {
      setProfile({ name: "Scout", email: "", role: "user", role_label: "Miembro Activo", avatar: "S" });
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-[#11072c]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold tracking-widest text-purple-300 animate-pulse uppercase">Cargando Plataforma...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginScreen onLogin={() => {}} />;
  }

  const currentPath = location.pathname.split("/")[1] || "dashboard";

  return (
    <div className="min-h-screen bg-[#faf9fe] flex flex-col lg:flex-row pb-16 lg:pb-0 selection:bg-purple-200">
      <Sidebar
        role={profile.role}
        currentScreen={currentPath}
        onNavigate={(screen: string) => navigate(`/${screen}`)}
        onLogout={() => supabase.auth.signOut()}
      />

      <main className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto w-full lg:p-4">
        <header className="bg-white border-b lg:border-none lg:rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30 lg:mt-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white bg-gradient-to-br from-purple-600 to-purple-800">
              {profile.avatar}
            </div>
            <div>
              <h2 className="text-xs font-black text-gray-800 tracking-tight">{profile.name}</h2>
              <p className="text-[10px] text-purple-600 font-bold mt-0.5">{profile.role_label}</p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-xl border flex items-center justify-center text-gray-400 hover:text-gray-600 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-600 rounded-full" />
          </button>
        </header>

        <div className="flex-1 pb-10 mt-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={profile.role === "admin" ? <AdminDashboard /> : <UserDashboard userProfile={profile} />}
            />
            <Route path="/catalogo" element={<CatalogoScreen />} />
            <Route path="/curso/:id" element={<CursoDetalleScreen userProfile={profile} />} />
            <Route path="/curso/:courseId/modulo/:moduleId" element={<ModuleViewerScreen />} />
            <Route path="/perfil" element={<ProfileScreen profile={profile} onSave={(updated) => setProfile(updated)} />} />

            {profile.role === "admin" && (
              <>
                <Route path="/users" element={<UsersScreen />} />
                <Route path="/admin-cursos" element={<AdminCursosScreen />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}