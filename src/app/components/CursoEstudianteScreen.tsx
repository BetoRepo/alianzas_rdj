import { useEffect, useState } from "react";
import { Lock, CheckCircle, Award, FileText, ArrowRight, HelpCircle, X, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { markModuleCompleted } from "../lib/progress";

export function CursoEstudianteScreen({ courseId, userId }: { courseId: number; userId: string }) {
  const [modules, setModules] = useState<any[]>([]);
  const [unlockedModules, setUnlockedModules] = useState<Record<number, boolean>>({});
  const [completedModules, setCompletedModules] = useState<Record<number, boolean>>({});
  const [hasCertificate, setHasCertificate] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    void loadCourseData();
  }, [courseId, userId]);

  async function loadCourseData() {
    // 1. Obtener módulos ordenados
    const { data: mods } = await supabase
      .from("modulos")
      .select("*")
      .eq("curso_id", courseId)
      .order("orden", { ascending: true });

    if (!mods || mods.length === 0) return;
    setModules(mods);

    // 2. Obtener progreso real del usuario desde la BD
    const modIds = mods.map((m) => m.id);
    const { data: progs } = await supabase
      .from("progreso_modulo")
      .select("modulo_id, completado")
      .eq("user_id", userId)
      .in("modulo_id", modIds);

    const completeMap: Record<number, boolean> = {};
    progs?.forEach((p) => {
      completeMap[p.modulo_id] = p.completado;
    });
    setCompletedModules(completeMap);

    // 3. Bloqueo Secuencial Estricto:
    // El Módulo 1 (índice 0) siempre se abre.
    // Los módulos siguientes SOLO se desbloquean si el Módulo ANTERIOR está completado.
    const unlockMap: Record<number, boolean> = {};
    mods.forEach((mod, index) => {
      if (index === 0) {
        unlockMap[mod.id] = true;
      } else {
        const prevModId = mods[index - 1].id;
        unlockMap[mod.id] = !!completeMap[prevModId];
      }
    });
    setUnlockedModules(unlockMap);

    // 4. Activar Certificado/Insignia SOLO si TODOS los módulos están completados
    const allCompleted = mods.every((m) => !!completeMap[m.id]);
    setHasCertificate(allCompleted);
  }

  async function openModule(mod: any) {
    if (!unlockedModules[mod.id]) {
      toast.warning("Debes completar el módulo anterior antes de acceder a este.");
      return;
    }
    setSelectedModule(mod);

    // Intentar cargar evaluaciones asociadas desde Supabase
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
      {/* Estructura Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Columna Izquierda: Información del Curso y Módulos */}
        <div className="lg:col-span-2 space-y-6">
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
          </div>

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
                        : "bg-gray-100/70 border-gray-200 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : isUnlocked
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-200 text-gray-500"
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

                    <div>
                      {!isUnlocked && (
                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                          Bloqueado
                        </span>
                      )}
                      {isUnlocked && !isCompleted && (
                        <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                          Estudiar <ArrowRight className="w-3.5 h-3.5" />
                        </span>
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

        {/* Columna Derecha: Tarjeta de Insignia */}
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
            onClick={() => setShowCertificateModal(true)}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all ${
              hasCertificate
                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70"
            }`}
          >
            Reclamar Insignia
          </button>
        </div>

      </div>

      {/* Modal del Módulo / Evaluación */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">{selectedModule.title || selectedModule.titulo}</h2>
              <button onClick={() => setSelectedModule(null)} aria-label="Cerrar módulo" className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium text-gray-700">Contenido educativo del módulo:</p>
              <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-500 border border-gray-100">
                {selectedModule.descripcion || "Lee atentamente la información antes de presentar tu evaluación."}
              </div>
            </div>

            {/* SECCIÓN DE EVALUACIÓN (Siempre Visible) */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-3">
              <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600" /> Evaluación del Módulo
              </h3>
              {evaluaciones.length > 0 ? (
                <div className="space-y-2">
                  {evaluaciones.map((evaluacion, index) => (
                    <div key={evaluacion.id} className="bg-white p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm">
                      <span>{index + 1}. {evaluacion.titulo}</span>
                      <button 
                        onClick={() => toast.info(`Iniciando evaluación: ${evaluacion.titulo}`)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Presentar Examen
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
                  <p className="text-xs text-gray-600">
                    Responde al cuestionario de comprobación de conocimientos para dar por completado este módulo.
                  </p>
                  <button
                    onClick={() => toast.info("Abriendo Cuestionario de Evaluación...")}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Presentar Evaluación
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedModule(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-200">
                Cerrar
              </button>
              <button onClick={() => handleCompleteModule(selectedModule.id)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm">
                Aprobar y Completar Módulo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Certificado/Insignia */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900">¡Felicidades, Hermano Scout!</h2>
            <p className="text-xs text-gray-500">Has demostrado las competencias necesarias en este plan de adelanto.</p>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-left space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-purple-600">Insignia Autorizada</span>
              <p className="font-bold text-sm text-gray-800">Participación Juvenil</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCertificateModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold text-xs text-gray-600">
                Cerrar
              </button>
              <button onClick={() => toast.info("Descargando Certificado PDF...")} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs">
                Descargar Certificado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}