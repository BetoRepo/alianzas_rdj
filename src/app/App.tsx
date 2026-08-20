import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "motion/react";

import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";
import { CommandPalette } from "./components/CommandPalette";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

const AdminDashboard = lazy(() => import("./components/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const UsersScreen = lazy(() => import("./components/UsersScreen").then(m => ({ default: m.UsersScreen })));
const AdminCursosScreen = lazy(() => import("./components/AdminCursosScreen"));
const UserDashboard = lazy(() => import("./views/UserDashboard"));
const CatalogoScreen = lazy(() => import("./views/CatalogoScreen"));
const InsigniasScreen = lazy(() => import("./views/InsigniasScreen"));
const CursoDetalleScreen = lazy(() => import("./views/CourseDetailScreen"));
const ModuleViewerScreen = lazy(() => import("./views/ModuleViewerScreen"));
const ProfileScreen = lazy(() => import("./views/ProfileScreen"));

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

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

  // Keyboard shortcut for command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
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
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #622599, #4a1c75)" }}>
        <LoadingSpinner size="lg" text="Cargando Plataforma..." />
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginScreen onLogin={() => {}} />;
  }

  const currentPath = location.pathname.split("/")[1] || "dashboard";

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col lg:flex-row pb-16 lg:pb-0 selection:bg-purple-200">
      <Toaster position="top-right" richColors />
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(screen: string) => navigate(`/${screen}`)}
        role={profile.role}
      />
      <Sidebar
        role={profile.role}
        currentScreen={currentPath}
        onNavigate={(screen: string) => navigate(`/${screen}`)}
        onLogout={() => supabase.auth.signOut()}
      />

      <main className="flex-1 flex flex-col min-w-0 w-full lg:p-4">
        <header className="bg-white border-b lg:border-none lg:rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-20 lg:mt-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg, #622599, #4a1c75)" }}>
              {profile.avatar}
            </div>
            <div>
              <h2 className="text-xs font-black text-gray-800 tracking-tight">{profile.name}</h2>
              <p className="text-[10px] text-[#622599] font-bold mt-0.5">{profile.role_label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#CFD8DC] text-gray-400 hover:text-[#622599] hover:border-[#622599]/30 text-xs font-medium transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">⌘K</kbd>
            </button>
            <button className="w-8 h-8 rounded-xl border border-[#CFD8DC] flex items-center justify-center text-gray-400 hover:text-[#622599] hover:border-[#622599]/30 relative transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#C62828] rounded-full" />
            </button>
          </div>
        </header>

        <div className="flex-1 pb-10 mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<LoadingSpinner fullScreen text="Cargando..." />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="/dashboard"
                    element={profile.role === "admin" ? <AdminDashboard /> : <UserDashboard userProfile={profile} />}
                  />
                  <Route path="/catalogo" element={<CatalogoScreen />} />
                  <Route path="/mis-cursos" element={<InsigniasScreen userProfile={profile} />} />
                  <Route path="/curso/:id" element={<CursoDetalleScreen userProfile={profile} />} />
                  <Route path="/curso/:courseId/modulo/:moduleId" element={<ModuleViewerScreen userProfile={profile} />} />
                  <Route path="/perfil" element={<ProfileScreen profile={profile} onSave={(updated) => setProfile(updated)} />} />

                  {profile.role === "admin" && (
                    <>
                      <Route path="/users" element={<UsersScreen />} />
                      <Route path="/admin-cursos" element={<AdminCursosScreen />} />
                    </>
                  )}

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}