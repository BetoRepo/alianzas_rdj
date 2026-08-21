import { useState, useEffect, FormEvent } from "react";
import { User, Shield, Trophy, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updateUserProfile } from "../lib/profile";
import { getUserDashboardStats } from "../lib/courses";

export default function ProfileScreen({
  profile,
  onSave,
}: {
  profile: any;
  onSave: (updatedProfile: any) => void;
}) {
  const [name, setName] = useState(profile?.name || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "S");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const [stats, setStats] = useState<any>({ completedCoursesCount: 0 });

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatar(profile.avatar || "S");
    }
  }, [profile]);

  useEffect(() => {
    async function loadStats() {
      if (profile?.id) {
        const data = await getUserDashboardStats(profile.id);
        setStats(data || { completedCoursesCount: 0 });
      }
    }
    void loadStats();
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg("");

    const updated = await updateUserProfile(profile.id, { 
      name: name.trim(), 
      avatar: avatar.trim().toUpperCase() 
    });

    if (updated) {
      onSave(updated);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3500);
    } else {
      setErrorMsg("No se pudieron guardar los cambios. Inténtalo de nuevo.");
    }

    setSaving(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <div>
        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Mi Cuenta</p>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>
          Perfil de Usuario
        </h1>
      </div>

      {/* Formulario e Previsualización */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
          {/* Avatar dinámico en vivo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xl font-black text-white shadow-md transition-all">
            {avatar || "S"}
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">{name || "Miembro Scout"}</h2>
            <p className="text-xs font-bold text-purple-600 mt-0.5">{profile?.role_label || "Miembro Activo"}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-600" /> Nombre Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-500 focus:bg-white font-medium text-gray-800"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" /> Iniciales para Avatar (Máx 2)
            </label>
            <input
              type="text"
              maxLength={2}
              value={avatar}
              onChange={(e) => setAvatar(e.target.value.toUpperCase())}
              className="w-28 text-xs bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-500 focus:bg-white font-black text-center text-purple-700 uppercase"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Cambios"}
            </button>

            {successMsg && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Perfil actualizado correctamente
              </span>
            )}

            {errorMsg && (
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Logros e Insignias */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Insignias Obtenidas ({stats.completedCoursesCount})
        </h3>

        {stats.completedCoursesCount === 0 ? (
          <div className="bg-gray-50/60 rounded-2xl p-5 text-center text-xs text-gray-400">
            Aún no has completado ningún programa para obtener insignias.
          </div>
        ) : (
          <div className="flex items-center gap-3.5 bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-gray-900">Cursos Certificados</p>
              <p className="text-[11px] text-gray-500">
                Has completado con éxito {stats.completedCoursesCount} programa(s) de formación.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}