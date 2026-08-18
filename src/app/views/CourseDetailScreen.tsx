import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  FileDown,
  Presentation,
  Award,
  AlertCircle,
  Lock,
  CheckCircle2,
  Trophy,
  Sparkles
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface ContentBlock {
  type: "text" | "image" | "video" | "slides" | "pdf";
  content: string;
  caption?: string;
}

interface QuizItem {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface EvaluationData {
  id: number;
  titulo: string;
  min_score: number;
  preguntas: QuizItem[];
}

interface ModuleData {
  id: number;
  titulo: string;
  duracion: string;
  contenido: any;
  evaluaciones: EvaluationData[];
}

interface CourseData {
  id: number;
  titulo: string;
  descripcion: string;
  badge: string;
}

export default function CourseDetailScreen() {
  const params = useParams();
  const actualCourseId = params.courseId || params.id;
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progreso de módulos completados
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  
  // Estado para ver el certificado final
  const [showCertificate, setShowCertificate] = useState(false);

  // Estados de evaluación
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [evalResult, setEvalResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    if (actualCourseId) {
      void fetchCourseData(actualCourseId);
    } else {
      setLoading(false);
      setError("No se encontró el identificador del curso en la URL.");
    }
  }, [actualCourseId]);

  async function fetchCourseData(id: string) {
    setLoading(true);
    setError(null);

    try {
      const { data: courseData, error: courseErr } = await supabase
        .from("cursos")
        .select("*")
        .eq("id", id)
        .single();

      if (courseErr) throw new Error(`Curso no encontrado: ${courseErr.message}`);

      setCourse({
        id: courseData.id,
        titulo: courseData.titulo || courseData.title || "Sin título",
        descripcion: courseData.descripcion || courseData.summary || "",
        badge: courseData.badge || "Capacitación"
      });

      const { data: modulesData, error: modulesErr } = await supabase
        .from("modulos")
        .select("*")
        .eq("curso_id", id)
        .order("orden", { ascending: true });

      if (modulesErr) throw new Error(`Error en módulos: ${modulesErr.message}`);

      const modIds = (modulesData || []).map((m) => m.id);
      let evalsData: any[] = [];

      if (modIds.length > 0) {
        try {
          const { data: evals } = await supabase
            .from("evaluaciones")
            .select("*")
            .in("modulo_id", modIds)
            .order("orden", { ascending: true });
          
          if (evals) evalsData = evals;
        } catch (e) {
          console.warn("Advertencia: No se pudieron sincronizar las evaluaciones:", e);
        }
      }

      const fullModules: ModuleData[] = (modulesData || []).map((mod) => {
        let parsedContent = mod.content || mod.contenido;
        if (typeof parsedContent === "string") {
            try {
                parsedContent = JSON.parse(parsedContent);
                if (typeof parsedContent === "string") {
                    parsedContent = JSON.parse(parsedContent);
                }
            } catch (e) {
                parsedContent = [{ type: "text", content: parsedContent }];
            }
        }

        const modEvals = evalsData
          .filter((e) => e.modulo_id === mod.id)
          .map((e) => ({
            id: e.id,
            titulo: e.titulo || "Evaluación",
            min_score: e.min_score || 70,
            preguntas: Array.isArray(e.preguntas)
              ? e.preguntas
              : typeof e.preguntas === "string"
              ? JSON.parse(e.preguntas || "[]")
              : []
          }));

        return {
          id: mod.id,
          titulo: mod.title || mod.titulo || "Módulo sin título",
          duracion: mod.duration || mod.duracion || "45 min",
          contenido: parsedContent,
          evaluaciones: modEvals
        };
      });

      setModules(fullModules);

      if (fullModules.length > 0) {
        setSelectedModuleId(fullModules[0].id);
      }
    } catch (err: any) {
      console.error("Error al cargar el curso:", err);
      setError(err.message || "No se pudo conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }

  // Avanzar al siguiente módulo o mostrar certificado si es el último
  function handleAdvanceToNextModule(currentModId: number) {
    if (!completedModules.includes(currentModId)) {
      setCompletedModules((prev) => [...prev, currentModId]);
    }

    const currentIndex = modules.findIndex((m) => m.id === currentModId);
    const nextModule = modules[currentIndex + 1];

    if (nextModule) {
      setSelectedModuleId(nextModule.id);
      setSelectedEvalId(null);
      setEvalResult(null);
      setUserAnswers({});
    } else {
      setShowCertificate(true);
    }
  }

  function handleAnswerSelect(questionIndex: number, optionIndex: number) {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  function handleSubmitQuiz() {
    if (!activeEval || !activeModule) return;

    let correctCount = 0;
    activeEval.preguntas.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / activeEval.preguntas.length) * 100);
    const passed = score >= activeEval.min_score;

    setEvalResult({ score, passed });

    if (passed && !completedModules.includes(activeModule.id)) {
      setCompletedModules((prev) => [...prev, activeModule.id]);
    }
  }

  function renderBlock(block: ContentBlock, index: number) {
    if (!block) return null;
    switch (block.type) {
      case "image":
        return (
          <div key={index} className="my-4 space-y-2">
            <img src={block.content} alt={block.caption || "Imagen"} className="w-full max-h-96 object-cover rounded-2xl border" />
            {block.caption && <p className="text-xs text-center text-gray-500 italic">{block.caption}</p>}
          </div>
        );
      case "video":
        return (
          <div key={index} className="my-4 space-y-2">
            <div className="aspect-video w-full rounded-2xl overflow-hidden border bg-black">
              <iframe src={block.content} title="Video" className="w-full h-full" allowFullScreen />
            </div>
            {block.caption && <p className="text-xs text-center text-gray-500 italic">{block.caption}</p>}
          </div>
        );
      case "pdf":
        return (
          <div key={index} className="my-6">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-t-2xl border border-b-0 border-purple-200">
              <div className="flex items-center gap-3">
                <FileDown className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-bold text-gray-800">{block.caption || "Documento PDF"}</p>
              </div>
              <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-purple-600">Abrir en pestaña nueva</a>
            </div>
            <div className="w-full h-[500px] border border-purple-200 rounded-b-2xl overflow-hidden bg-gray-50">
              <iframe src={block.content} className="w-full h-full" title="Visor PDF" />
            </div>
          </div>
        );
      case "slides":
        return (
          <div key={index} className="my-6">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-t-2xl border border-b-0 border-purple-200">
              <div className="flex items-center gap-3">
                <Presentation className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-bold text-gray-800">{block.caption || "Presentación"}</p>
              </div>
              <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-purple-600">Descargar original</a>
            </div>
            <div className="w-full h-[500px] border border-purple-200 rounded-b-2xl overflow-hidden bg-gray-50">
              <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(block.content)}&embedded=true`} className="w-full h-full" title="Visor Presentación" />
            </div>
          </div>
        );
      case "text":
      default:
        return <div key={index} className="my-3 text-sm leading-relaxed text-gray-700 whitespace-pre-line">{block.content}</div>;
    }
  }

  const activeModule = modules.find((m) => m.id === selectedModuleId);
  const activeEval = activeModule?.evaluaciones.find((e) => e.id === selectedEvalId);
  const isAllCompleted = modules.length > 0 && completedModules.length === modules.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-purple-800">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold text-gray-600">
          <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
        </button>
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-rose-900">No se pudo cargar el curso</h2>
          <p className="text-xs text-rose-700">{error || "Intenta recargar la página."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-purple-600 transition-all">
        <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-8 rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">{course.badge}</span>
          {isAllCompleted && (
            <button
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-amber-950 font-black text-xs rounded-xl shadow-md hover:bg-amber-300 transition-all animate-bounce"
            >
              <Trophy className="w-4 h-4" /> Ver Certificado
            </button>
          )}
        </div>
        <h1 className="text-3xl font-black">{course.titulo}</h1>
        {course.descripcion && <p className="text-sm text-purple-100 max-w-3xl">{course.descripcion}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar de Módulos */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Contenido del Curso</h3>
          <div className="space-y-2">
            {modules.map((mod, idx) => {
              const isSelected = selectedModuleId === mod.id && selectedEvalId === null && !showCertificate;
              const isLocked = idx > 0 && !completedModules.includes(modules[idx - 1].id);
              const isCompleted = completedModules.includes(mod.id);

              return (
                <div key={mod.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (isLocked) return;
                      setShowCertificate(false);
                      setSelectedModuleId(mod.id);
                      setSelectedEvalId(null);
                      setEvalResult(null);
                      setUserAnswers({});
                    }}
                    disabled={isLocked}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isLocked
                        ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-80"
                        : isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white text-gray-800 border-gray-100 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isLocked ? "bg-gray-200 text-gray-500" : isSelected ? "bg-white/20 text-white" : "bg-purple-50 text-purple-700"}`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : (idx + 1)}
                      </span>
                      <div>
                        <p className={`text-xs font-bold line-clamp-1 ${isCompleted && !isSelected ? "text-emerald-700" : ""}`}>{mod.titulo}</p>
                        <p className={`text-[10px] ${isLocked ? "text-gray-400" : isSelected ? "text-purple-200" : "text-gray-400"}`}>{mod.duracion}</p>
                      </div>
                    </div>
                    {isLocked ? <Lock className="w-4 h-4 text-gray-300" /> : <ChevronRight className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`} />}
                  </button>

                  {!isLocked && mod.evaluaciones.map((ev) => {
                    const isEvalSelected = selectedModuleId === mod.id && selectedEvalId === ev.id && !showCertificate;
                    return (
                      <button
                        key={ev.id}
                        onClick={() => {
                          setShowCertificate(false);
                          setSelectedModuleId(mod.id);
                          setSelectedEvalId(ev.id);
                          setEvalResult(null);
                          setUserAnswers({});
                        }}
                        className={`w-full ml-4 p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition-all ${
                          isEvalSelected ? "bg-amber-50 text-amber-900 border-amber-300 shadow-sm" : "bg-white text-gray-600 border-gray-100 hover:border-amber-200"
                        }`}
                        style={{ width: "calc(100% - 1rem)" }}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span className="line-clamp-1">{ev.titulo}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visor Principal */}
        <div className="lg:col-span-2">
          {showCertificate ? (
            /* Pantalla del Certificado */
            <div className="bg-white p-8 rounded-3xl border-4 border-amber-300 shadow-2xl text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Trophy className="w-64 h-64 text-amber-500" />
              </div>
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
              <span className="px-4 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black uppercase tracking-widest">
                Certificado de Aprobación
              </span>
              <h2 className="text-2xl font-black text-gray-900">¡Felicidades por completar el curso!</h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Has completado con éxito todos los módulos y evaluaciones del programa <strong className="text-gray-800">{course.titulo}</strong>.
              </p>

              <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-2">
                <p className="text-xs text-amber-800 font-bold uppercase">Otorgado a</p>
                <p className="text-lg font-black text-gray-900">Participante Destacado</p>
                <p className="text-[10px] text-gray-400">Emisión verificada por la plataforma de capacitación</p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-lg transition-all"
              >
                Imprimir / Guardar Certificado
              </button>
            </div>
          ) : selectedEvalId && activeEval ? (
            /* Visor de Evaluación */
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <span className="text-xs font-bold text-amber-600 uppercase">Evaluación</span>
                <h2 className="text-xl font-black text-gray-900">{activeEval.titulo}</h2>
                <p className="text-xs text-gray-500">Mínimo para aprobar: {activeEval.min_score}%</p>
              </div>

              {evalResult ? (
                <div className={`p-6 rounded-2xl text-center space-y-4 ${evalResult.passed ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"}`}>
                  <Award className={`w-12 h-12 mx-auto ${evalResult.passed ? "text-emerald-600" : "text-rose-500"}`} />
                  <h3 className="text-lg font-bold">{evalResult.passed ? "¡Felicidades! Aprobaste la evaluación." : "Necesitas un nuevo intento."}</h3>
                  <p className="text-sm font-bold">Puntaje obtenido: {evalResult.score}%</p>
                  
                  {evalResult.passed ? (
                    <button
                      onClick={() => handleAdvanceToNextModule(activeModule!.id)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
                    >
                      Siguiente Módulo <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setEvalResult(null); setUserAnswers({}); }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                    >
                      Reintentar Evaluación
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {activeEval.preguntas.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm font-bold text-gray-800">{qIdx + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${userAnswers[qIdx] === optIdx ? "bg-purple-50 border-purple-300 text-purple-900" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                            <input type="radio" name={`quiz_q_${qIdx}`} checked={userAnswers[qIdx] === optIdx} onChange={() => handleAnswerSelect(qIdx, optIdx)} className="text-purple-600" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(userAnswers).length < activeEval.preguntas.length}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    Enviar Respuestas
                  </button>
                </div>
              )}
            </div>
          ) : activeModule ? (
            /* Visor de Módulo */
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <span className="text-xs font-bold text-purple-600 uppercase">Módulo</span>
                <h2 className="text-xl font-black text-gray-900">{activeModule.titulo}</h2>
              </div>

              <div className="space-y-4">
                {!Array.isArray(activeModule.contenido) || activeModule.contenido.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">No hay contenido redactado para este módulo aún.</p>
                ) : (
                  activeModule.contenido.map((block: any, idx: number) => renderBlock(block, idx))
                )}
              </div>

              {/* Botón Dinámico al final del Módulo */}
              <div className="pt-6 border-t mt-8">
                {activeModule.evaluaciones && activeModule.evaluaciones.length > 0 ? (
                  <button
                    onClick={() => setSelectedEvalId(activeModule.evaluaciones[0].id)}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Presentar Evaluación del Módulo
                  </button>
                ) : (
                  <button
                    onClick={() => handleAdvanceToNextModule(activeModule.id)}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Completar y Pasar al Siguiente Módulo <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center py-12">
              <p className="text-xs text-gray-400">Selecciona un módulo para ver su contenido.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}