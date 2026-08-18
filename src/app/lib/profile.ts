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
export async function updateUserProfile(userId: string, updates: { name?: string; avatar?: string }) {
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