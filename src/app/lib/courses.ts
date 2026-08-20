import { supabase } from "./supabase";

export async function getCourses() {
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al consultar cursos:", error);
    return [];
  }

  return data || [];
}

export async function getModulesByCourseId(courseId: string) {
  const { data, error } = await supabase
    .from("modulos")
    .select("*")
    .eq("curso_id", courseId)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener módulos:", error);
    return [];
  }

  return data || [];
}

export async function getModuleById(moduleId: string) {
  const { data, error } = await supabase
    .from("modulos")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (error) {
    console.error("Error al obtener módulo:", error);
    return null;
  }

  return data;
}

export async function markModuleAsCompleted(userId: string, moduleId: string) {
  const { error } = await supabase
    .from("progreso_modulo")
    .upsert(
      { user_id: userId, modulo_id: moduleId, completado: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id,modulo_id" }
    );

  if (error) {
    console.error("Error al registrar progreso:", error);
    return false;
  }

  return true;
}

export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from("progreso_modulo")
    .select("modulo_id")
    .eq("user_id", userId)
    .eq("completado", true);

  if (error) {
    console.error("Error al obtener progreso:", error);
    return [];
  }

  return data.map((item) => item.modulo_id);
}

export async function getUserDashboardStats(userId: string) {
  const { data: courses } = await supabase.from("cursos").select("id");
  const totalCourses = courses?.length || 0;

  const { data: progress } = await supabase
    .from("progreso_modulo")
    .select("modulo_id, completado")
    .eq("user_id", userId)
    .eq("completado", true);

  const completedModuleIds = progress?.map((p) => p.modulo_id) || [];

  const { data: modules } = await supabase.from("modulos").select("id, curso_id");

  if (!modules || modules.length === 0) {
    return { completedCoursesCount: 0, totalCourses, completedModulesCount: 0, totalModules: 0 };
  }

  const modulesByCourse: Record<string, string[]> = {};
  modules.forEach((m) => {
    if (!modulesByCourse[m.curso_id]) modulesByCourse[m.curso_id] = [];
    modulesByCourse[m.curso_id].push(m.id);
  });

  let completedCoursesCount = 0;
  Object.keys(modulesByCourse).forEach((courseId) => {
    const courseModules = modulesByCourse[courseId];
    const isFinished = courseModules.every((modId) => completedModuleIds.includes(modId));
    if (isFinished && courseModules.length > 0) {
      completedCoursesCount++;
    }
  });

  return {
    completedCoursesCount,
    totalCourses,
    completedModulesCount: completedModuleIds.length,
    totalModules: modules.length,
  };
}