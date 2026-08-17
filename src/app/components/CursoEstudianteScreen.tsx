import { useEffect, useState } from "react";
import { Lock, CheckCircle, Award, FileText, ArrowRight } from "lucide-react";
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
    // 1. Cargar Módulos ordenados
    const { data: mods } = await supabase
      .from("modulos")
      .select("*")
      .eq("curso_id", courseId)
      .order("orden", { ascending: true });

    if (!mods) return;
    setModules(mods);

    // 2. Cargar estado de desbloqueo y completado secuencial
    const unlockMap: Record<number, boolean> = {};
    const completeMap: Record<number, boolean> = {};

    for (let i = 0; i < mods.length; i++) {
      const mod = mods[i];
      
      // El primer módulo (índice 0) SIEMPRE debe estar desbloqueado
      let unlocked = i === 0;

      if (!unlocked) {
        unlocked = await canAccessModule(userId, courseId, mod.orden);
      }
      
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

    // 3. Verificar si completó el 100% de los módulos
    const certAllowed = await canDownloadCertificate(userId, courseId);
    setHasCertificate(certAllowed);
  }

  async function openModule(mod: any) {
    if (!unlockedModules[mod.id]) {
      alert("Debes completar el módulo anterior antes de acceder a este.");
      return;
    }
    setSelectedModule(mod);

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Estructura Principal en Grid de 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Columna Izquierda: Información y Módulos del Curso */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Banner de Cabecera del Curso */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 font-bold text-xs rounded-full">
                Liderazgo
              </span>
              <span className="text-xs text-gray-400 font-medium">
                2 horas de contenido
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Participación Juvenil
            </h1>
            <p className="text-xs text-gray-400">.</p>
          </div>

          {/* Módulos del Plan de Adelanto */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900">
              Módulos del Plan de Adelanto
            </h2>

            <div className="space-y-3">
              {modules.map((mod, index) => {
                const isUnlocked = unlockedModules[mod.id];
                const isCompleted = completedModules[mod.id];

                return (
                  <div
                    key={mod.id}
                    onClick={() => isUnlocked && openModule(mod)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? "bg-white border-purple-100 hover:border-purple-300 shadow-sm cursor-pointer"
                        : "bg-gray-50/70 border-gray-100 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Número del módulo o Ícono de Candado */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isCompleted 
                          ? "bg-emerald-100 text-emerald-700" 
                          : isUnlocked 
                          ? "bg-purple-50 text-purple-700" 
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : !isUnlocked ? <Lock className="w-4 h-4" /> : index + 1}
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">
                          {mod.title || mod.titulo}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {mod.duration || mod.duracion || "1 Hora"}
                        </span>
                      </div>
                    </div>

                    {/* Estado del Módulo */}
                    <div>
                      {!isUnlocked && (
                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                          Bloqueado
                        </span>
                      )}
                      {isUnlocked && !isCompleted && (
                        <button className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:underline">
                          Estudiar <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isCompleted && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Completado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Certificación e Insignia */}
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm text-center space-y-4 lg:sticky lg:top-8">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-black text-gray-900 text-base">
              Certificación de Especialidad
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed px-2">
              Completa el 100% de las lecturas y aprueba los cuestionarios para liberar tu insignia virtual.
            </p>
          </div>

          <button
            disabled={!hasCertificate}
            onClick={() => alert("¡Insignia Reclamada y Certificado Generado!")}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all ${
              hasCertificate
                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg cursor-pointer"
                : "bg-purple-200 text-white cursor-not-allowed opacity-70"
            }`}
          >
            Reclamar Insignia
          </button>
        </div>

      </div>

      {/* Modal / Vista de Módulo Activo */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">{selectedModule.title || selectedModule.titulo}</h2>

            <div className="text-sm text-gray-600 space-y-2">
              <p>Aquí se renderiza el contenido del módulo (Texto, Imágenes, Videos, PDFs)...</p>
            </div>

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