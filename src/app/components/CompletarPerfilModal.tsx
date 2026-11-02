import { useState, type FormEvent } from "react";
import { Save, LogOut, Compass } from "lucide-react";
import { toast } from "sonner";
import { updateUserProfile, validarDatosScout } from "../lib/profile";
import { DatosScoutFields, datosScoutDe } from "./DatosScoutFields";

// Ventana obligatoria al ingresar si al perfil le faltan los datos scout
export function CompletarPerfilModal({
  profile,
  onSave,
  onLogout
}: {
  profile: any;
  onSave: (updatedProfile: any) => void;
  onLogout: () => void;
}) {
  const [datos, setDatos] = useState(() => datosScoutDe(profile));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validarDatosScout(datos);
    if (error) return toast.warning(error);

    setSaving(true);
    const updated = await updateUserProfile(profile.id, {
      fecha_nacimiento: datos.fecha_nacimiento,
      grupo: datos.grupo.trim(),
      region: datos.region.trim(),
      distrito: datos.distrito.trim(),
      unidad: datos.unidad
    });
    setSaving(false);

    if (!updated) return toast.error("No se pudieron guardar tus datos. Inténtalo de nuevo.");
    toast.success("¡Perfil completado!");
    onSave(updated);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completar-perfil-titulo"
        className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8"
      >
        <div className="flex items-start gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 id="completar-perfil-titulo" className="text-lg font-black text-gray-900">
              ¡Hola, {profile?.name?.split(" ")[0] || "Scout"}! Completa tu perfil
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Antes de continuar necesitamos algunos datos sobre ti y tu unidad. Solo te tomará un minuto.
            </p>
          </div>
        </div>

        <DatosScoutFields value={datos} onChange={setDatos} />

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar y continuar"}
          </button>
        </div>
      </form>
    </div>
  );
}
