import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Video,
  Image as ImageIcon,
  Presentation,
  FileDown,
  Award,
  AlertCircle
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
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de evaluación
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [evalResult, setEvalResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    if (courseId) {
      void fetchCourseData(courseId);
    }
  }, [courseId]);

  async function fetchCourseData(id: string) {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener curso
      const { data: courseData, error: courseErr } = await supabase
        .from("cursos")
        .select("*")
        .eq("id", id)
        .single();

      if (courseErr) throw courseErr;

      setCourse({
        id: courseData.id,
        titulo: courseData.titulo || courseData.title || "Sin título",
        descripcion: courseData.descripcion || courseData.summary || "",
        badge: courseData.badge || "Capacitación"
      });

      // 2. Obtener módulos
      const { data: modulesData, error: modulesErr } = await supabase
        .from("modulos")
        .select("*")
        .eq("curso_id", id)
        .order("orden", { ascending: true });

      if (modulesErr) throw modulesErr;

      // 3. Obtener evaluaciones para los módulos
      const modIds = (modulesData || []).map((m) => m.id);
      let evalsData: any[] = [];

      if (modIds.length > 0) {
        const { data: evals, error: evalsErr } = await supabase
          .from("evaluaciones")
          .select("*")
          .in("modulo_id", modIds)
          .order("orden", { ascending: true });

        if (!evalsErr && evals) {
          evalsData = evals;
        }
      }

      // Mapear módulos adaptándonos a las columnas de Supabase ('content', 'title', 'duration')
      const fullModules: ModuleData[] = (modulesData || []).map((mod) => {
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
          contenido: mod.content || mod.contenido,
          evaluaciones: modEvals
        };
      });

      setModules(fullModules);

      if (fullModules.length > 0) {
        setSelectedModuleId(fullModules[0].id);
      }
    } catch (err: any) {
      console.error("Error cargando curso:", err);
      setError(err.message || "Error al cargar el contenido del curso.");
    } finally {
      setLoading(false);
    }
  }

  // Parsear los bloques de contenido (soporta doble parseo en caso de JSON escapado)
  function getParsedBlocks(contentField: any): ContentBlock[] {
    if (!contentField) return [];

    let data = contentField;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
      } catch {
        return [{ type: "text", content: contentField }];
      }
    }

    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null) return [data];

    return [];
  }

  // Renderizador de Bloques
  function renderBlock(block: ContentBlock, index: number) {
    switch (block.type) {
      case "image":
        return (
          <div key={index} className="my-4 space-y-2">
            <img
              src={block.content}
              alt={block.caption || "Imagen del módulo"}
              className="w-full max-h-96 object-cover rounded-2xl border"
            />
            {block.caption && (
              <p className="text-xs text-center text-gray-500 italic">{block.caption}</p>
            )}
          </div>
        );
      case "video":
        return (
          <div key={index} className="my-4 space-y-2">
            <div className="aspect-video w-full rounded-2xl overflow-hidden border bg-black">
              <iframe
                src={block.content}
                title={block.caption || "Video del módulo"}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
            {block.caption && (
              <p className="text-xs text-center text-gray-500 italic">{block.caption}</p>
            )}
          </div>
        );
      case "slides":
      case "pdf":
        return (
          <div key={index} className="my-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {block.type === "slides" ? (
                <Presentation className="w-6 h-6 text-purple-600" />
              ) : (
                <FileDown className="w-6 h-6 text-purple-600" />
              )}
              <div>
                <p className="text-sm font-bold text-gray-800">{block.caption || "Recurso descargable"}</p>
                <p className="text-xs text-gray-500 uppercase">{block.type}</p>
              </div>
            </div>
            <a
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-purple-700 transition-all"
            >
              Ver Recurso
            </a>
          </div>
        );
      case "text":
      default:
        return (
          <div key={index} className="my-3 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
            {block.content}
          </div>
        );
    }
  }

  // Lógica de Evaluación
  const activeModule = modules.find((m) => m.id === selectedModuleId);
  const activeEval = activeModule?.evaluaciones.find((e) => e.id === selectedEvalId);

  function handleAnswerSelect(questionIndex: number, optionIndex: number) {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  function handleSubmitQuiz() {
    if (!activeEval) return;

    let correctCount = 0;
    activeEval.preguntas.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / activeEval.preguntas.length) * 100);
    const passed = score >= activeEval.min_score;

    setEvalResult({ score, passed });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando curso...</p>
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
          <h2 className="text-base font-bold text-rose-900">Error al cargar el curso</h2>
          <p className="text-xs text-rose-700">{error || "No se encontró la información esperada."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-purple-600 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
      </button>

      {/* Cabecera del Curso */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-8 rounded-3xl shadow-lg space-y-3">
        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
          {course.badge}
        </span>
        <h1 className="text-3xl font-black">{course.titulo}</h1>
        {course.descripcion && <p className="text-sm text-purple-100 max-w-3xl">{course.descripcion}</p>}
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navegación de Módulos */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Contenido del Curso</h3>
          <div className="space-y-2">
            {modules.map((mod, idx) => {
              const isSelected = selectedModuleId === mod.id && selectedEvalId === null;
              return (
                <div key={mod.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedModuleId(mod.id);
                      setSelectedEvalId(null);
                      setEvalResult(null);
                      setUserAnswers({});
                    }}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white text-gray-800 border-gray-100 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? "bg-white/20 text-white" : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold line-clamp-1">{mod.titulo}</p>
                        <p className={`text-[10px] ${isSelected ? "text-purple-200" : "text-gray-400"}`}>
                          {mod.duracion}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
                  </button>

                  {/* Evaluaciones del Módulo */}
                  {mod.evaluaciones.map((ev) => {
                    const isEvalSelected = selectedModuleId === mod.id && selectedEvalId === ev.id;
                    return (
                      <button
                        key={ev.id}
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setSelectedEvalId(ev.id);
                          setEvalResult(null);
                          setUserAnswers({});
                        }}
                        className={`w-full ml-4 p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition-all ${
                          isEvalSelected
                            ? "bg-amber-50 text-amber-900 border-amber-300 shadow-sm"
                            : "bg-white text-gray-600 border-gray-100 hover:border-amber-200"
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

        {/* Visor de Módulo / Evaluación */}
        <div className="lg:col-span-2">
          {selectedEvalId && activeEval ? (
            /* Vista de Evaluación */
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <span className="text-xs font-bold text-amber-600 uppercase">Evaluación</span>
                <h2 className="text-xl font-black text-gray-900">{activeEval.titulo}</h2>
                <p className="text-xs text-gray-500">Mínimo para aprobar: {activeEval.min_score}%</p>
              </div>

              {evalResult ? (
                <div
                  className={`p-6 rounded-2xl text-center space-y-3 ${
                    evalResult.passed ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"
                  }`}
                >
                  <Award
                    className={`w-12 h-12 mx-auto ${evalResult.passed ? "text-emerald-600" : "text-rose-500"}`}
                  />
                  <h3 className="text-lg font-bold">
                    {evalResult.passed ? "¡Felicidades! Aprobaste." : "Necesitas un nuevo intento."}
                  </h3>
                  <p className="text-sm font-bold">Puntaje obtenido: {evalResult.score}%</p>
                  <button
                    onClick={() => {
                      setEvalResult(null);
                      setUserAnswers({});
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                  >
                    Reintentar Evaluación
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeEval.preguntas.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm font-bold text-gray-800">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              userAnswers[qIdx] === optIdx
                                ? "bg-purple-50 border-purple-300 text-purple-900"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz_q_${qIdx}`}
                              checked={userAnswers[qIdx] === optIdx}
                              onChange={() => handleAnswerSelect(qIdx, optIdx)}
                              className="text-purple-600"
                            />
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
            /* Vista de Contenido de Módulo */
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <span className="text-xs font-bold text-purple-600 uppercase">Módulo</span>
                <h2 className="text-xl font-black text-gray-900">{activeModule.titulo}</h2>
              </div>

              <div className="space-y-4">
                {getParsedBlocks(activeModule.contenido).length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">
                    No hay contenido redactado para este módulo aún.
                  </p>
                ) : (
                  getParsedBlocks(activeModule.contenido).map((block, idx) => renderBlock(block, idx))
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