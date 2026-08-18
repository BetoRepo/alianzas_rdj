import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, ChevronRight, PlayCircle,
  FileText, Award, HelpCircle, AlertCircle, RefreshCw
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

interface Evaluation {
  id: number;
  titulo: string;
  min_score: number;
  preguntas: QuizItem[];
}

interface ModuleData {
  id: number;
  titulo: string;
  duracion: string;
  contenido: string | ContentBlock[];
  evaluaciones?: Evaluation[];
}

export default function CursoDetalleScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [activeModule, setActiveModule] = useState<ModuleData | null>(null);
  const [activeEval, setActiveEval] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado del Quiz
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (id) {
      void fetchCourseData(Number(id));
    }
  }, [id]);

  async function fetchCourseData(courseId: number) {
    setLoading(true);
    try {
      // 1. Obtener detalles del curso
      const { data: courseData, error: courseError } = await supabase
        .from("cursos")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // 2. Obtener módulos
      const { data: modulesData, error: modulesError } = await supabase
        .from("modulos")
        .select("*")
        .eq("curso_id", courseId)
        .order("orden", { ascending: true });

      if (modulesError) throw modulesError;

      // 3. Obtener evaluaciones para cada módulo
      const modIds = (modulesData || []).map((m) => m.id);
      let evalsData: any[] = [];
      if (modIds.length > 0) {
        const { data: evals } = await supabase
          .from("evaluaciones")
          .select("*")
          .in("modulo_id", modIds)
          .order("orden", { ascending: true });
        evalsData = evals || [];
      }

      // Ensamblar módulos con sus evaluaciones
      const fullModules: ModuleData[] = (modulesData || []).map((mod) => {
        const modEvals = evalsData
          .filter((e) => e.modulo_id === mod.id)
          .map((e) => ({
            id: e.id,
            titulo: e.titulo,
            min_score: e.min_score || 70,
            preguntas: Array.isArray(e.preguntas)
              ? e.preguntas
              : JSON.parse(e.preguntas || "[]")
          }));

        return {
          ...mod,
          evaluaciones: modEvals
        };
      });

      setModules(fullModules);
      if (fullModules.length > 0) {
        setActiveModule(fullModules[0]);
      }
    } catch (err: any) {
      console.error("Error cargando detalle del curso:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Parsear bloques de contenido dinámicos
  function getParsedBlocks(contenido: string | ContentBlock[]): ContentBlock[] {
    if (Array.isArray(contenido)) return contenido;
    try {
      const parsed = JSON.parse(contenido);
      return Array.isArray(parsed) ? parsed : [{ type: "text", content: contenido }];
    } catch {
      return [{ type: "text", content: contenido || "" }];
    }
  }

  // Selección de opciones en la evaluación
  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  // Enviar y calificar la evaluación
  const handleSubmitQuiz = () => {
    if (!activeEval) return;
    let correctCount = 0;
    activeEval.preguntas.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / activeEval.preguntas.length) * 100);
    setScore(finalScore);
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleSelectModule = (mod: ModuleData) => {
    setActiveModule(mod);
    setActiveEval(null);
    resetQuiz();
  };

  const handleSelectEval = (evalItem: Evaluation) => {
    setActiveEval(evalItem);
    resetQuiz();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-gray-400 animate-pulse">
        Cargando contenidos del curso...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-gray-600">No se encontró el curso solicitado.</p>
        <button
          onClick={() => navigate("/catalogo")}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Botón Volver */}
      <button
        onClick={() => navigate("/catalogo")}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-purple-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
      </button>

      {/* Cabecera del Curso */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/10 text-purple-200 rounded-lg text-[10px] font-black uppercase tracking-wider">
            {course.badge || "Capacitación"}
          </span>
          <h1 className="text-xl md:text-2xl font-black">{course.titulo}</h1>
          <p className="text-xs text-purple-200 line-clamp-2 max-w-2xl">{course.descripcion}</p>
        </div>
      </div>

      {/* Grid Principal: Menú Módulos + Área de Trabajo */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* NAVEGACIÓN DE MÓDULOS (COLUMNA IZQUIERDA) */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">
            Contenido del Curso
          </h2>

          <div className="space-y-2">
            {modules.map((mod, index) => {
              const isSelected = activeModule?.id === mod.id && !activeEval;
              return (
                <div key={mod.id} className="space-y-1">
                  <button
                    onClick={() => handleSelectModule(mod)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-100 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                        isSelected ? "bg-white/20 text-white" : "bg-purple-50 text-purple-700"
                      }`}>
                        {index + 1}
                      </span>
                      <span className="line-clamp-1">{mod.titulo}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
                  </button>

                  {/* Evaluaciones asociadas al módulo */}
                  {mod.evaluaciones && mod.evaluaciones.length > 0 && (
                    <div className="pl-4 space-y-1">
                      {mod.evaluaciones.map((ev) => {
                        const isEvalSelected = activeEval?.id === ev.id;
                        return (
                          <button
                            key={ev.id}
                            onClick={() => {
                              setActiveModule(mod);
                              handleSelectEval(ev);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-2 ${
                              isEvalSelected
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : "bg-amber-50/50 text-amber-900 border-amber-100 hover:bg-amber-100/50"
                            }`}
                          >
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span className="line-clamp-1">{ev.titulo}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ÁREA DE CONTENIDO O EVALUACIÓN (COLUMNA DERECHA) */}
        <div className="lg:col-span-3">
          {activeEval ? (
            /* COMPONENTE DE EVALUACIÓN / QUIZ */
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                    Evaluación del Módulo
                  </span>
                  <h2 className="text-lg font-black text-gray-900">{activeEval.titulo}</h2>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                  Aprobación: {activeEval.min_score}%
                </span>
              </div>

              {/* Preguntas */}
              <div className="space-y-6">
                {activeEval.preguntas.map((q, qIdx) => {
                  const selectedOpt = answers[qIdx];
                  const isCorrect = selectedOpt === q.correct;

                  return (
                    <div key={qIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <p className="text-xs font-extrabold text-gray-900">
                        {qIdx + 1}. {q.question}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          let optionStyle = "bg-white border-gray-200 text-gray-700 hover:border-purple-400";

                          if (selectedOpt === optIdx) {
                            optionStyle = "bg-purple-600 border-purple-600 text-white font-bold";
                          }

                          if (quizSubmitted) {
                            if (optIdx === q.correct) {
                              optionStyle = "bg-emerald-500 border-emerald-500 text-white font-bold";
                            } else if (selectedOpt === optIdx && !isCorrect) {
                              optionStyle = "bg-rose-500 border-rose-500 text-white font-bold";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(qIdx, optIdx)}
                              className={`p-3 rounded-xl border text-xs text-left transition-all ${optionStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explicación si se respondió */}
                      {quizSubmitted && q.explanation && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón de Enviar o Resultado */}
              <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(answers).length < activeEval.preguntas.length}
                    className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    Enviar Respuestas
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border">
                    <div className="flex items-center gap-3">
                      {score >= activeEval.min_score ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-rose-500" />
                      )}
                      <div>
                        <p className="text-xs font-black text-gray-900">
                          Tu Puntaje: {score}%
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {score >= activeEval.min_score
                            ? "¡Felicidades! Has aprobado esta evaluación."
                            : "No alcanzaste la nota mínima. Inténtalo nuevamente."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={resetQuiz}
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeModule ? (
            /* RENDERIZADO DEL MÓDULO DE APRENDIZAJE */
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                    Módulo
                  </span>
                  <h2 className="text-lg font-black text-gray-900">{activeModule.titulo}</h2>
                </div>
                <span className="text-xs font-bold text-gray-400">{activeModule.duracion}</span>
              </div>

              {/* Render dinámico de bloques de contenido */}
              <div className="space-y-6">
                {getParsedBlocks(activeModule.contenido).map((block, idx) => (
                  <div key={idx} className="space-y-2">
                    {/* TEXTO */}
                    {block.type === "text" && (
                      <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line">
                        {block.content}
                      </p>
                    )}

                    {/* IMAGEN */}
                    {block.type === "image" && (
                      <div className="space-y-1">
                        <img
                          src={block.content}
                          alt={block.caption || "Imagen del módulo"}
                          className="w-full max-h-96 object-cover rounded-2xl border"
                        />
                        {block.caption && (
                          <p className="text-[10px] text-center text-gray-400 font-medium">{block.caption}</p>
                        )}
                      </div>
                    )}

                    {/* VIDEO */}
                    {block.type === "video" && (
                      <div className="space-y-1">
                        {block.content.includes("youtube.com") || block.content.includes("youtu.be") ? (
                          <iframe
                            src={block.content.replace("watch?v=", "embed/")}
                            title="Video explicativo"
                            className="w-full h-72 md:h-96 rounded-2xl border"
                            allowFullScreen
                          />
                        ) : (
                          <video controls src={block.content} className="w-full rounded-2xl border" />
                        )}
                        {block.caption && (
                          <p className="text-[10px] text-center text-gray-400 font-medium">{block.caption}</p>
                        )}
                      </div>
                    )}

                    {/* PDF O SLIDES */}
                    {(block.type === "pdf" || block.type === "slides") && (
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">
                              {block.caption || "Documento Adjunto"}
                            </p>
                            <p className="text-[10px] text-gray-500">Recurso complementario</p>
                          </div>
                        </div>
                        <a
                          href={block.content}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                        >
                          Abrir Recurso
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}