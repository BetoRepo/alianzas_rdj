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
  // Tres consultas en paralelo en lugar de una tras otra
  const [{ count: totalCourses }, { data: progress }, { data: modules }] = await Promise.all([
    supabase.from("cursos").select("id", { count: "exact", head: true }),
    supabase.from("progreso_modulo").select("modulo_id").eq("user_id", userId).eq("completado", true),
    supabase.from("modulos").select("id, curso_id")
  ]);

  const completedModuleIds = new Set((progress || []).map((p) => p.modulo_id));

  if (!modules || modules.length === 0) {
    return { completedCoursesCount: 0, totalCourses: totalCourses || 0, completedModulesCount: 0, totalModules: 0 };
  }

  const modulesByCourse = new Map<number, number[]>();
  modules.forEach((m) => {
    const list = modulesByCourse.get(m.curso_id) || [];
    list.push(m.id);
    modulesByCourse.set(m.curso_id, list);
  });

  let completedCoursesCount = 0;
  modulesByCourse.forEach((courseModules) => {
    if (courseModules.every((modId) => completedModuleIds.has(modId))) completedCoursesCount++;
  });

  return {
    completedCoursesCount,
    totalCourses: totalCourses || 0,
    completedModulesCount: modules.filter((m) => completedModuleIds.has(m.id)).length,
    totalModules: modules.length,
  };
}

// Devuelve el curso requisito que falta terminar, o null si el curso está disponible
export function cursoBloqueado(course: any, courses: any[], completedIds: Set<number>, esAdmin = false) {
  if (esAdmin || !course.requisito_id || completedIds.has(course.requisito_id)) return null;
  return courses.find((c) => c.id === course.requisito_id) ?? null;
}

// Cursos con todos sus módulos regulares completados (la introducción no cuenta,
// igual que para mostrar el certificado), con la fecha del último módulo terminado
export async function getCompletedCourses(userId: string) {
  const [{ data: courses }, { data: progress }] = await Promise.all([
    supabase.from("cursos").select("id, titulo, imagen_url, badge, modulos(id, tipo)"),
    supabase.from("progreso_modulo").select("modulo_id, updated_at").eq("user_id", userId).eq("completado", true)
  ]);

  const completedAt = new Map((progress || []).map((p) => [p.modulo_id, p.updated_at as string | null]));

  return (courses || [])
    .map((c: any) => {
      const regular = (c.modulos || []).filter((m: any) => m.tipo !== "intro");
      if (regular.length === 0 || !regular.every((m: any) => completedAt.has(m.id))) return null;
      const fechas = regular.map((m: any) => completedAt.get(m.id)).filter(Boolean).sort();
      return {
        id: c.id as number,
        titulo: (c.titulo || "Curso") as string,
        imagen_url: (c.imagen_url || null) as string | null,
        badge: (c.badge || null) as string | null,
        completedAt: (fechas.at(-1) || null) as string | null
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
}
