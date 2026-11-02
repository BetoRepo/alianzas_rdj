import { supabase } from "./supabase";

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { name: "Scout", email: "", role: "user", role_label: "Miembro Activo", avatar: "S" };
  }

  return data;
}
export const UNIDADES = [
  { unidad: "Manada", rama: "Lobato" },
  { unidad: "Tropa", rama: "Scout" },
  { unidad: "Comunidad", rama: "Caminante" },
  { unidad: "Clan", rama: "Rover" }
] as const;

export type DatosScout = {
  fecha_nacimiento: string;
  grupo: string;
  region: string;
  distrito: string;
  unidad: string;
};

export function ramaDeUnidad(unidad?: string | null) {
  return UNIDADES.find((u) => u.unidad === unidad)?.rama ?? null;
}

export function calcularEdad(fechaNacimiento?: string | null) {
  if (!fechaNacimiento) return null;
  const nac = new Date(`${fechaNacimiento}T00:00:00`);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// Un perfil recién creado no tiene estos datos; se piden al ingresar
export function perfilIncompleto(profile: any) {
  return !profile?.fecha_nacimiento || !ramaDeUnidad(profile?.unidad) ||
    !profile?.grupo?.trim() || !profile?.region?.trim() || !profile?.distrito?.trim();
}

// Devuelve un mensaje de error o null si los datos están bien
export function validarDatosScout(datos: DatosScout) {
  const edad = calcularEdad(datos.fecha_nacimiento);
  if (edad === null) return "Indica tu fecha de nacimiento.";
  if (edad < 0 || edad > 120) return "La fecha de nacimiento no es válida.";
  if (!datos.grupo.trim()) return "Escribe tu grupo.";
  if (!datos.region.trim()) return "Escribe tu región.";
  if (!datos.distrito.trim()) return "Escribe tu distrito.";
  if (!ramaDeUnidad(datos.unidad)) return "Elige tu unidad.";
  return null;
}

export async function updateUserProfile(userId: string, updates: { name?: string; avatar?: string } & Partial<DatosScout>) {
  const { data, error } = await supabase
    .from("perfiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar perfil:", error);
    return null;
  }

  return data;
}