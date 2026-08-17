import { supabase } from "./supabase";

// 🔒 Verificar si el estudiante puede acceder a un módulo específico
export async function canAccessModule(userId: string, courseId: number, currentOrder: number): Promise<boolean> {
  // El primer módulo (orden 1) siempre está desbloqueado
  if (currentOrder <= 1) return true;

  // Obtener el ID del módulo anterior
  const { data: prevModule } = await supabase
    .from("modulos")
    .select("id")
    .eq("curso_id", courseId)
    .eq("orden", currentOrder - 1)
    .maybeSingle();

  if (!prevModule) return true;

  // Verificar si el módulo anterior fue completado
  const { data: progress } = await supabase
    .from("progreso_modulo")
    .select("completado")
    .eq("user_id", userId)
    .eq("modulo_id", prevModule.id)
    .maybeSingle();

  return progress?.completado === true;
}

// 🎓 Verificar si el estudiante puede descargar el certificado del curso
export async function canDownloadCertificate(userId: string, courseId: number): Promise<boolean> {
  const { data: modules } = await supabase
    .from("modulos")
    .select("id")
    .eq("curso_id", courseId);

  if (!modules || modules.length === 0) return false;

  const moduleIds = modules.map((m) => m.id);

  const { data: completedProgress } = await supabase
    .from("progreso_modulo")
    .select("id")
    .eq("user_id", userId)
    .eq("completado", true)
    .in("modulo_id", moduleIds);

  return (completedProgress?.length || 0) === modules.length;
}

// ✅ Marcar un módulo como completado
export async function markModuleCompleted(userId: string, moduloId: number) {
  const { error } = await supabase
    .from("progreso_modulo")
    .upsert(
      { user_id: userId, modulo_id: moduloId, completado: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id,modulo_id" }
    );

  if (error) console.error("Error al guardar progreso:", error.message);
}