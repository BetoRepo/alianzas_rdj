import { supabase } from "./supabase";

export async function markModuleCompleted(userId: string, moduloId: number) {
  const { error } = await supabase
    .from("progreso_modulo")
    .upsert(
      { user_id: userId, modulo_id: moduloId, completado: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id,modulo_id" }
    );

  if (error) console.error("Error al guardar progreso:", error.message);
}
