import { useState, useEffect } from "react";
import { User, Shield, Trophy, Save, CheckCircle2 } from "lucide-react";
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
  const [successMsg, setSuccessMsg] = useState(false);
  const [stats, setStats] = useState<any>({ completedCoursesCount: 0 });

  useEffect(() => {
    async function loadStats() {
      if (profile?.id) {
        const data = await getUserDashboardStats(profile.id);
        setStats(data);
      }
    }
    loadStats();
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    setSuccessMsg(false);

    const updated = await updateUserProfile(profile.id, { name, avatar });

    if (updated) {
      onSave(updated);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }

    setSaving(false);
  }

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-bold text-purple-500 uppercase tracking-wider">Mi Cuenta</p>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Perfil de Usuario</h2>
      </div>

      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xl font-black text-white shadow-md">
            {avatar}
          </div>
          <div>
            <h3 className="text-base font-black text-gray-800">{profile?.name}</h3>
            <p className="text-xs font-bold text-purple-600 mt-0.5">{profile?.role_label || "Miembro Activo"}</p>
            <p className="text-[10px] text-gray-400 mt-1">{profile?.email}</p>
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
              className="w-full text-xs bg-gray-50 border rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-500 focus:bg-white font-medium text-gray-800"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" /> Inicial de Avatar
            </label>
            <input
              type="text"
              maxLength={2}
              value={avatar}
              onChange={(e) => setAvatar(e.target.value.toUpperCase())}
              className="w-24 text-xs bg-gray-50 border rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-500 focus:bg-white font-bold text-center text-gray-800"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
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
          </div>
        </form>
      </div>

      {/* Logros e Insignias */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Insignias Obtenidas ({stats.completedCoursesCount})
        </h3>

        {stats.completedCoursesCount === 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-400">
            Aún no has completado ningún curso para obtener insignias.
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Cursos Certificados</p>
              <p className="text-[10px] text-gray-500">
                Has completado {stats.completedCoursesCount} programa(s) de formación con éxito.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}