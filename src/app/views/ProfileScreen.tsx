import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Trophy, Save, Lock, Pencil, X, FileDown, Cake, Users, MapPin, Map as MapIcon, Tent, Award } from "lucide-react";
import { toast } from "sonner";
import { updateUserProfile, validarDatosScout, ramaDeUnidad, calcularEdad, etiquetaPerfil } from "../lib/profile";
import { DatosScoutFields, datosScoutDe } from "../components/DatosScoutFields";
import { supabase } from "../lib/supabase";
import { getCompletedCourses } from "../lib/courses";
import { descargarCertificadoPDF } from "../lib/certificado";

type CursoCompletado = Awaited<ReturnType<typeof getCompletedCourses>>[number];

const inputClass =
  "w-full text-xs bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-500 focus:bg-white";

function Dato({ icon: Icon, label, value }: { icon: typeof Cake; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-gray-50/60 rounded-2xl">
      <Icon className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xs font-bold text-gray-800 truncate">{value || <span className="text-gray-400 font-medium">Sin completar</span>}</p>
      </div>
    </div>
  );
}

export default function ProfileScreen({
  profile,
  onSave,
}: {
  profile: any;
  onSave: (updatedProfile: any) => void;
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [changingPasswordOpen, setChangingPasswordOpen] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "S");
  const [datos, setDatos] = useState(() => datosScoutDe(profile));
  const [saving, setSaving] = useState(false);
  const [completados, setCompletados] = useState<CursoCompletado[] | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  function resetForm() {
    setName(profile?.name || "");
    setAvatar(profile?.avatar || "S");
    setDatos(datosScoutDe(profile));
  }

  useEffect(() => {
    if (profile && !editing) resetForm();
  }, [profile]);

  useEffect(() => {
    if (profile?.id) void getCompletedCourses(profile.id).then(setCompletados);
  }, [profile?.id]);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) return toast.warning("La contraseña debe tener al menos 6 caracteres.");
    setChangingPassword(true);
    const { error } = await supabase.rpc("cambiar_password", { p_actual: currentPassword, p_nueva: newPassword });
    setChangingPassword(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada.");
    closePassword();
  }

  function closePassword() {
    setChangingPasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;
    const datosError = validarDatosScout(datos);
    if (datosError) return toast.warning(datosError);

    setSaving(true);
    const updated = await updateUserProfile(profile.id, {
      name: name.trim(),
      avatar: avatar.trim().toUpperCase(),
      fecha_nacimiento: datos.fecha_nacimiento,
      grupo: datos.grupo.trim(),
      region: datos.region.trim(),
      distrito: datos.distrito.trim(),
      unidad: datos.unidad
    });
    setSaving(false);

    if (!updated) return toast.error("No se pudieron guardar los cambios. Inténtalo de nuevo.");
    onSave(updated);
    setEditing(false);
    toast.success("Perfil actualizado correctamente.");
  }

  async function handleDownload(curso: CursoCompletado) {
    setDownloadingId(curso.id);
    try {
      await descargarCertificadoPDF(profile?.name || "Participante Destacado", curso.titulo);
    } catch (err: any) {
      toast.error(err.message || "No se pudo generar el certificado.");
    } finally {
      setDownloadingId(null);
    }
  }

  const edad = calcularEdad(profile?.fecha_nacimiento);
  const rama = ramaDeUnidad(profile?.unidad);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <div>
        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Mi Cuenta</p>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>
          Perfil de Usuario
        </h1>
      </div>

      {/* Resumen del perfil */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xl font-black text-white shadow-md transition-all overflow-hidden">
            {!avatar || avatar === "S" ? (
              <img src="/images/flor-de-lis.svg" alt="" className="w-full h-full object-contain p-1" />
            ) : (
              avatar
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-gray-900">{name || "Miembro Scout"}</h2>
            <p className="text-xs font-bold text-purple-600 mt-0.5">{etiquetaPerfil(profile)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{profile?.email}</p>
          </div>
          {!editing && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { resetForm(); setEditing(true); }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center gap-1.5 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar perfil
              </button>
              {!changingPasswordOpen && (
                <button
                  onClick={() => setChangingPasswordOpen(true)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" /> Cambiar contraseña
                </button>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" /> Nombre Completo
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} font-medium text-gray-800`} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-600" /> Iniciales (Máx 2)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value.toUpperCase())}
                  className={`${inputClass} sm:w-28 font-black text-center text-purple-700 uppercase`}
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <p className="text-xs font-black text-gray-900">Datos Scout</p>
              <DatosScoutFields value={datos} onChange={setDatos} />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setEditing(false); }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Dato icon={Tent} label="Unidad / Rama" value={rama && `${profile.unidad} · ${rama}`} />
            <Dato icon={Cake} label="Edad" value={edad !== null && `${edad} años`} />
            <Dato icon={Users} label="Grupo" value={profile?.grupo} />
            <Dato icon={MapIcon} label="Región" value={profile?.region} />
            <Dato icon={MapPin} label="Distrito" value={profile?.distrito} />
          </div>
        )}
      </div>

      {/* Cambiar contraseña (solo al pedirlo) */}
      {changingPasswordOpen && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600" /> Cambiar Contraseña
            </h3>
            <button type="button" onClick={closePassword} aria-label="Cerrar cambio de contraseña" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="password"
              placeholder="Contraseña actual"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="password"
              placeholder="Nueva contraseña (mín. 6)"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Lock className="w-4 h-4" /> {changingPassword ? "Guardando..." : "Actualizar Contraseña"}
          </button>
        </form>
      )}

      {/* Cursos realizados y certificados */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Cursos Realizados ({completados?.length ?? 0})
        </h3>

        {completados === null ? (
          <p className="text-xs text-gray-400 text-center py-4">Cargando cursos...</p>
        ) : completados.length === 0 ? (
          <div className="bg-gray-50/60 rounded-2xl p-5 text-center text-xs text-gray-400">
            Aún no has completado ningún curso. Cuando termines uno, aquí podrás descargar tu certificado.
          </div>
        ) : (
          <ul className="space-y-2">
            {completados.map((curso) => (
              <li key={curso.id} className="flex flex-wrap items-center gap-3 p-3 bg-amber-50/40 border border-amber-100 rounded-2xl">
                {curso.imagen_url ? (
                  <img src={curso.imagen_url} alt="" className="w-16 h-11 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-16 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                )}
                <button onClick={() => navigate(`/curso/${curso.id}`)} className="flex-1 min-w-[10rem] text-left">
                  <p className="text-xs font-extrabold text-gray-900 hover:text-purple-700 line-clamp-1">{curso.titulo}</p>
                  <p className="text-[11px] text-gray-500">
                    {curso.badge && `${curso.badge} · `}
                    {curso.completedAt
                      ? `Completado el ${new Date(curso.completedAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}`
                      : "Completado"}
                  </p>
                </button>
                <button
                  onClick={() => handleDownload(curso)}
                  disabled={downloadingId !== null}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" /> {downloadingId === curso.id ? "Generando..." : "Certificado PDF"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
