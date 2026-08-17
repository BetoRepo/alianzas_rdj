import { useEffect, useState } from "react";
import { Lock, CheckCircle, Download, Award, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
import { canAccessModule, canDownloadCertificate, markModuleCompleted } from "../lib/progress";

export function CursoEstudianteScreen({ courseId, userId }: { courseId: number; userId: string }) {
  const [modules, setModules] = useState<any[]>([]);
  const [unlockedModules, setUnlockedModules] = useState<Record<number, boolean>>({});
  const [completedModules, setCompletedModules] = useState<Record<number, boolean>>({});
  const [hasCertificate, setHasCertificate] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);

  useEffect(() => {
    void loadCourseData();
  }, [courseId, userId]);

  async function loadCourseData() {
    // 1. Cargar Módulos
    const { data: mods } = await supabase
      .from("modulos")
      .select("*")
      .eq("curso_id", courseId)
      .order("orden", { ascending: true });

    if (!mods) return;
    setModules(mods);

    // 2. Cargar estado de desbloqueo y completado por módulo
    const unlockMap: Record<number, boolean> = {};
    const completeMap: Record<number, boolean> = {};

    for (const mod of mods) {
      const unlocked = await canAccessModule(userId, courseId, mod.orden);
      unlockMap[mod.id] = unlocked;

      const { data: prog } = await supabase
        .from("progreso_modulo")
        .select("completado")
        .eq("user_id", userId)
        .eq("modulo_id", mod.id)
        .maybeSingle();

      completeMap[mod.id] = prog?.completado || false;
    }

    setUnlockedModules(unlockMap);
    setCompletedModules(completeMap);

    // 3. Verificar Certificado
    const certAllowed = await canDownloadCertificate(userId, courseId);
    setHasCertificate(certAllowed);
  }

  async function openModule(mod: any) {
    if (!unlockedModules[mod.id]) {
      alert("Debes completar el módulo anterior antes de acceder a este.");
      return;
    }
    setSelectedModule(mod);

    // Cargar las múltiples evaluaciones de la tabla 'evaluaciones'
    const { data: evals } = await supabase
      .from("evaluaciones")
      .select("*")
      .eq("modulo_id", mod.id)
      .order("orden", { ascending: true });

    setEvaluaciones(evals || []);
  }

  async function handleCompleteModule(moduloId: number) {
    await markModuleCompleted(userId, moduloId);
    await loadCourseData();
    setSelectedModule(null);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Botón de Certificado */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
            <Award className="w-5 h-5" /> Insignia / Certificado de Reconocimiento
          </div>
          <p className="text-xs text-purple-200">
            {hasCertificate
              ? "¡Felicidades! Has completado el 100% de los módulos de este curso."
              : "Completa todos los módulos y evaluaciones para desbloquear tu certificado."}
          </p>
        </div>
        <button
          disabled={!hasCertificate}
          onClick={() => alert("Generando Certificado PDF Scout...")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            hasCertificate
              ? "bg-amber-400 text-purple-950 hover:bg-amber-300 shadow-lg cursor-pointer"
              : "bg-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          <Download className="w-4 h-4" /> Descargar Certificado
        </button>
      </div>

      {/* Lista de Módulos */}
      <div className="space-y-3">
        <h2 className="text-xl font-black text-gray-900">Módulos del Curso</h2>
        {modules.map((mod) => {
          const isUnlocked = unlockedModules[mod.id];
          const isCompleted = completedModules[mod.id];

          return (
            <div
              key={mod.id}
              onClick={() => isUnlocked && openModule(mod)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                isUnlocked
                  ? "bg-white border-purple-100 hover:border-purple-300 shadow-sm cursor-pointer"
                  : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isCompleted ? "bg-emerald-100 text-emerald-700" : isUnlocked ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-500"}`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : isUnlocked ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{mod.title}</h3>
                  <span className="text-xs text-gray-400">{mod.duration}</span>
                </div>
              </div>

              {!isUnlocked && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">Bloqueado</span>}
              {isCompleted && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Completado</span>}
            </div>
          );
        })}
      </div>

      {/* Modal / Vista de Módulo Activo con Múltiples Evaluaciones */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">{selectedModule.title}</h2>

            {/* Contenido multimedia del módulo */}
            <div className="text-sm text-gray-600 space-y-2">
              <p>Aquí se renderiza el contenido del módulo (Texto, Imágenes, Videos, PDFs)...</p>
            </div>

            {/* Lista de Evaluaciones del Módulo */}
            {evaluaciones.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-3">
                <h3 className="font-bold text-sm text-purple-900">Evaluaciones requeridas ({evaluaciones.length}):</h3>
                {evaluaciones.map((evaluacion, index) => (
                  <div key={evaluacion.id} className="bg-white p-3 rounded-xl border flex items-center justify-between text-xs font-semibold">
                    <span>{index + 1}. {evaluacion.titulo} (Aprobación: {evaluacion.min_score}%)</span>
                    <button onClick={() => alert(`Iniciar ${evaluacion.titulo}`)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg">Realizar Examen</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setSelectedModule(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-700">Cerrar</button>
              <button onClick={() => handleCompleteModule(selectedModule.id)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm">Marcar como Completado</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}