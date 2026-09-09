import { useState, useEffect, type FormEvent } from "react";
import {
  PlusCircle, Trash2, X, BookOpen, Layers, Edit2, Plus, FileUp, HelpCircle, ArrowUp, ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { supabase, DEFAULT_STORAGE_BUCKET } from "../lib/supabase";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface QuizItem {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface EvaluationForm {
  id?: number;
  titulo: string;
  min_score: number;
  preguntas: QuizItem[];
}

interface ContentBlock {
  type: "text" | "image" | "video" | "slides" | "pdf";
  content: string;
  caption?: string;
}

interface ModuleForm {
  title: string;
  duration: string;
  tipo: string;
  blocks: ContentBlock[];
  evaluaciones: EvaluationForm[];
}

function createDefaultQuestion(): QuizItem {
  return { question: "", options: ["", "", "", ""], correct: 0, explanation: "" };
}

function createDefaultEvaluation(index = 0): EvaluationForm {
  return {
    titulo: `Evaluación ${index + 1}`,
    min_score: 70,
    preguntas: [createDefaultQuestion()]
  };
}

function createDefaultModule(): ModuleForm {
  return {
    title: "",
    duration: "",
    tipo: "regular",
    blocks: [{ type: "text", content: "", caption: "" }],
    evaluaciones: [createDefaultEvaluation(0)]
  };
}

function normalizeBlocks(blocks: ContentBlock[]) {
  return blocks
    .map((block) => ({
      type: block.type === "image" || block.type === "video" || block.type === "slides" || block.type === "pdf" ? block.type : "text",
      content: block.content || "",
      caption: block.caption || ""
    }))
    .filter((block) => block.content.trim() || block.caption?.trim());
}

function buildQuizPayload(preguntas: QuizItem[]) {
  return preguntas
    .filter((q) => q.question.trim())
    .map((q) => ({
      question: q.question,
      options: q.options,
      correct: Number(q.correct),
      explanation: q.explanation
    }));
}

export default function AdminCursosScreen() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({
    title: "",
    badge: "Básico",
    summary: "",
    cover_image: "",
    category: "General"
  });

  const [activeCourse, setActiveCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm | null>(null);
  const [uploading, setUploading] = useState(false);

  // Estados para ConfirmDialog
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState<{ open: boolean; courseId: string | null }>({ open: false, courseId: null });
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState<{ open: boolean; moduleId: number | null }>({ open: false, moduleId: null });

  useEffect(() => {
    void fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cursos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error al cargar cursos:", error.message);
    else setCourses(data || []);
    setLoading(false);
  }

  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    if (!newCourse.title.trim()) return toast.warning("El título es requerido");

    const { error } = await supabase.from("cursos").insert([
      {
        titulo: newCourse.title,
        descripcion: newCourse.summary,
        duracion: "1 hora",
        imagen_url: newCourse.cover_image,
        badge: newCourse.badge,
        category: newCourse.category
      }
    ]);

    if (error) {
      toast.error("Error al crear curso: " + error.message);
    } else {
      setNewCourse({
        title: "",
        badge: "Básico",
        summary: "",
        cover_image: "",
        category: "General"
      });
      void fetchCourses();
    }
  }

  async function handleDeleteCourse(id: number) {
    const { error } = await supabase.from("cursos").delete().eq("id", id);
    if (error) toast.error("Error al eliminar curso: " + error.message);
    else {
      if (activeCourse?.id === id) setActiveCourse(null);
      void fetchCourses();
    }
  }

  async function handleManageModules(course: any) {
    setActiveCourse(course);
    setModuleForm(null);
    setEditingModuleId(null);
    void fetchModules(course.id);
  }

  async function fetchModules(courseId: number) {
    const { data, error } = await supabase
      .from("modulos")
      .select("*")
      .eq("curso_id", courseId)
      .order("orden", { ascending: true });

    if (error) console.error("Error al cargar módulos:", error.message);
    else setModules(data || []);
  }

  async function handleOpenEditModule(mod: any) {
    setEditingModuleId(mod.id);

    const rawContent = mod.contenido || mod.content;
    let parsedBlocks: ContentBlock[] = [];
    try {
      parsedBlocks = typeof rawContent === "string" ? JSON.parse(rawContent) : (rawContent || []);
    } catch {
      parsedBlocks = [{ type: "text", content: rawContent || "", caption: "" }];
    }
    if (!parsedBlocks.length) {
      parsedBlocks = [{ type: "text", content: "", caption: "" }];
    }

    const { data: evalsData } = await supabase
      .from("evaluaciones")
      .select("*")
      .eq("modulo_id", mod.id)
      .order("orden", { ascending: true });

    let formEvals: EvaluationForm[] = [];

    if (evalsData && evalsData.length > 0) {
      formEvals = evalsData.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        min_score: e.min_score || 70,
        preguntas: Array.isArray(e.preguntas)
          ? e.preguntas
          : typeof e.preguntas === "string"
          ? JSON.parse(e.preguntas || "[]")
          : []
      }));
    } else {
      let legacyQuiz: QuizItem[] = [];
      try {
        legacyQuiz = typeof mod.quiz === "string" ? JSON.parse(mod.quiz || "[]") : (mod.quiz || []);
      } catch {
        legacyQuiz = [];
      }

      formEvals = [
        {
          titulo: "Evaluación Principal",
          min_score: 70,
          preguntas: legacyQuiz.length > 0 ? legacyQuiz : [createDefaultQuestion()]
        }
      ];
    }

    setModuleForm({
      title: mod.titulo || mod.title || "",
      duration: mod.duracion || mod.duration || "",
      tipo: mod.tipo || "regular",
      blocks: parsedBlocks,
      evaluaciones: formEvals
    });
  }

  async function handleSaveModule() {
    if (!activeCourse || !moduleForm) return;
    if (!moduleForm.title.trim()) return toast.warning("El título del módulo es obligatorio.");

    setUploading(true);
    try {
      const contentPayload = JSON.stringify(normalizeBlocks(moduleForm.blocks));
      let moduloId = editingModuleId;

      const modulePayload = {
        curso_id: activeCourse.id,
        title: moduleForm.title,
        duration: moduleForm.duration,
        tipo: moduleForm.tipo,
        content: contentPayload,
        quiz: "[]"
      };

      if (editingModuleId) {
        const { error: modError } = await supabase
          .from("modulos")
          .update(modulePayload)
          .eq("id", editingModuleId);

        if (modError) throw modError;
      } else {
        const { data: newMod, error: modError } = await supabase
          .from("modulos")
          .insert([
            {
              ...modulePayload,
              orden: moduleForm.tipo === "intro" ? 0 : modules.length + 1
            }
          ])
          .select()
          .single();

        if (modError) throw modError;
        moduloId = newMod.id;
      }

      const { data: currentEvals } = await supabase
        .from("evaluaciones")
        .select("id")
        .eq("modulo_id", moduloId);

      const currentEvalIds = (currentEvals || []).map((e: any) => e.id);
      const updatedEvalIds: number[] = [];

      for (let i = 0; i < moduleForm.evaluaciones.length; i++) {
        const ev = moduleForm.evaluaciones[i];
        const validQuestions = buildQuizPayload(ev.preguntas);

        if (ev.id) {
          const { error: evalError } = await supabase
            .from("evaluaciones")
            .update({
              titulo: ev.titulo || `Evaluación ${i + 1}`,
              min_score: Number(ev.min_score) || 70,
              preguntas: validQuestions,
              orden: i + 1
            })
            .eq("id", ev.id);

          if (evalError) throw evalError;
          updatedEvalIds.push(ev.id);
        } else {
          const { data: newEval, error: evalError } = await supabase
            .from("evaluaciones")
            .insert([
              {
                modulo_id: moduloId,
                titulo: ev.titulo || `Evaluación ${i + 1}`,
                min_score: Number(ev.min_score) || 70,
                preguntas: validQuestions,
                orden: i + 1
              }
            ])
            .select()
            .single();

          if (evalError) throw evalError;
          if (newEval) updatedEvalIds.push(newEval.id);
        }
      }

      const toDeleteIds = currentEvalIds.filter((id: number) => !updatedEvalIds.includes(id));
      if (toDeleteIds.length > 0) {
        await supabase.from("evaluaciones").delete().in("id", toDeleteIds);
      }

      toast.success("¡Módulo y evaluaciones guardados exitosamente!");
      setModuleForm(null);
      setEditingModuleId(null);
      void fetchModules(activeCourse.id);
    } catch (err: any) {
      toast.error("Error al guardar: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteModule(moduloId: number) {
    const { error } = await supabase.from("modulos").delete().eq("id", moduloId);
    if (error) toast.error("Error al eliminar módulo: " + error.message);
    else if (activeCourse) void fetchModules(activeCourse.id);
  }

  async function handleReorderModule(moduloId: number, direction: "up" | "down") {
    const currentIndex = modules.findIndex((m) => m.id === moduloId);
    if (currentIndex === -1) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= modules.length) return;

    const currentMod = modules[currentIndex];
    const swapMod = modules[swapIndex];

    // Actualizar localmente primero para respuesta inmediata
    const updated = [...modules];
    updated[currentIndex] = swapMod;
    updated[swapIndex] = currentMod;
    setModules(updated);

    // Persistir en la base de datos
    try {
      const { error: err1 } = await supabase
        .from("modulos")
        .update({ orden: swapMod.orden })
        .eq("id", currentMod.id);

      const { error: err2 } = await supabase
        .from("modulos")
        .update({ orden: currentMod.orden })
        .eq("id", swapMod.id);

      if (err1 || err2) throw new Error("Error al reordenar módulos");
      toast.success("Orden actualizado");
    } catch (err: any) {
      toast.error("Error al reordenar: " + err.message);
      // Revertir en caso de error
      void fetchModules(activeCourse!.id);
    }
  }

  async function handleFileUpload(file: File, blockIndex: number) {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `modulos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(DEFAULT_STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(DEFAULT_STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (moduleForm) {
        const updatedBlocks = [...moduleForm.blocks];
        updatedBlocks[blockIndex].content = urlData.publicUrl;
        setModuleForm({ ...moduleForm, blocks: updatedBlocks });
      }
    } catch (err: any) {
      toast.error("Error subiendo archivo: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* CABECERA Y CREACIÓN DE CURSO */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Administrador de Cursos</h1>
            <p className="text-xs text-gray-500">Crea cursos, módulos interactivos y múltiples evaluaciones</p>
          </div>
        </div>

        <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Título del Curso</label>
            <input
              type="text"
              placeholder="Ej: Liderazgo Scout Afectivo"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nivel / Insignia</label>
            <select
              value={newCourse.badge}
              onChange={(e) => setNewCourse({ ...newCourse, badge: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="Básico">Básico</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
              <option value="Especial">Especial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">URL Imagen Portada</label>
            <input
              type="text"
              placeholder="https://..."
              value={newCourse.cover_image}
              onChange={(e) => setNewCourse({ ...newCourse, cover_image: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Resumen del Curso</label>
            <input
              type="text"
              placeholder="Breve descripción del curso..."
              value={newCourse.summary}
              onChange={(e) => setNewCourse({ ...newCourse, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" /> Crear Nuevo Curso
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-10">
            <LoadingSpinner text="Cargando catálogo de cursos..." />
          </div>
        ) : (
          courses.map((course) => {
            const courseTitle = course.titulo || course.title;
            const courseDesc = course.descripcion || course.summary;
            const courseCover = course.imagen_url || course.cover_image;

            return (
              <div key={course.id} className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  {courseCover && (
                    <img src={courseCover} alt={courseTitle} className="w-full h-32 object-cover rounded-2xl" />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">{course.badge || "Especial"}</span>
                    <span className="text-xs text-gray-400 font-medium">{course.category || "General"}</span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-snug">{courseTitle}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{courseDesc || "Sin resumen disponible."}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => handleManageModules(course)}
                    className="flex-1 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Layers className="w-4 h-4" /> Módulos y Evaluaciones
                  </button>
                  <button
                    onClick={() => setDeleteCourseConfirm({ open: true, courseId: course.id })}
                    aria-label={`Eliminar curso ${course.titulo}`}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE GESTIÓN DE MÓDULOS */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase">Gestión de Curso</span>
                <h2 className="text-xl font-black text-gray-900">{activeCourse.titulo || activeCourse.title}</h2>
              </div>
              <button onClick={() => setActiveCourse(null)} aria-label="Cerrar gestión de módulos" className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!moduleForm ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-sm">Módulos Existentes ({modules.length})</h3>
                  <button
                    onClick={() => {
                      setEditingModuleId(null);
                      setModuleForm(createDefaultModule());
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Nuevo Módulo
                  </button>
                </div>

                <div className="space-y-2">
                  {modules.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Este curso no tiene módulos registrados.</p>
                  ) : (
                    modules.map((mod, idx) => (
                      <div key={mod.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={() => handleReorderModule(mod.id, "up")}
                              disabled={idx === 0}
                              aria-label="Subir módulo"
                              className="p-0.5 text-gray-400 hover:text-purple-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReorderModule(mod.id, "down")}
                              disabled={idx === modules.length - 1}
                              aria-label="Bajar módulo"
                              className="p-0.5 text-gray-400 hover:text-purple-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-800 text-sm">{mod.titulo || mod.title}</h4>
                              {mod.tipo === "intro" && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">Intro</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{mod.duracion || mod.duration || "Sin duración"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModule(mod)}
                            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => setDeleteModuleConfirm({ open: true, moduleId: mod.id })}
                            aria-label={`Eliminar módulo ${mod.titulo}`}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* EDITOR DE MÓDULO CON EVALUACIONES */
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl">
                  <h3 className="font-black text-purple-900 text-base">
                    {editingModuleId ? "Editar Módulo" : "Nuevo Módulo"}
                  </h3>
                  <button onClick={() => setModuleForm(null)} className="text-xs font-bold text-purple-700 underline">
                    Volver a la lista
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Título del Módulo</label>
                    <input
                      type="text"
                      placeholder="Ej: Módulo 1 - Historia Scout"
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Duración (ej: 45 min)</label>
                    <input
                      type="text"
                      placeholder="45 min"
                      value={moduleForm.duration}
                      onChange={(e) => setModuleForm({ ...moduleForm, duration: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="text-xs font-bold text-gray-700">Tipo de módulo:</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setModuleForm({ ...moduleForm, tipo: "regular" })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        moduleForm.tipo === "regular"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-purple-50"
                      }`}
                    >
                      Regular
                    </button>
                    <button
                      onClick={() => {
                        const hasIntro = modules.some((m) => m.tipo === "intro" && m.id !== editingModuleId);
                        if (hasIntro) {
                          toast.warning("Ya existe un módulo de introducción en este curso. Elimínalo primero si deseas crear otro.");
                          return;
                        }
                        setModuleForm({ ...moduleForm, tipo: "intro" });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        moduleForm.tipo === "intro"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-amber-50"
                      }`}
                    >
                      ▶ Introducción
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400 ml-1">
                    {moduleForm.tipo === "intro" ? "Se muestra antes del primer módulo" : "Módulo normal del curso"}
                  </span>
                </div>

                {/* BLOQUES MULTIMEDIA */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-800">Bloques de Contenido</h4>
                    <div className="flex gap-1">
                      {(["text", "image", "video", "slides", "pdf"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setModuleForm({
                              ...moduleForm,
                              blocks: [...moduleForm.blocks, { type, content: "", caption: "" }]
                            })
                          }
                          className="px-2.5 py-1 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 rounded-lg text-xs font-bold capitalize"
                        >
                          + {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {moduleForm.blocks.map((block, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-2xl border space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 uppercase">Bloque #{idx + 1} ({block.type})</span>
                        <button
                          onClick={() => {
                            const newBlocks = moduleForm.blocks.filter((_, i) => i !== idx);
                            setModuleForm({ ...moduleForm, blocks: newBlocks });
                          }}
                          aria-label={`Eliminar bloque ${idx + 1}`}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {block.type === "text" ? (
                        <textarea
                          rows={3}
                          placeholder="Escribe el contenido de este bloque..."
                          aria-label="Contenido del bloque de texto"
                          value={block.content}
                          onChange={(e) => {
                            const b = [...moduleForm.blocks];
                            b[idx].content = e.target.value;
                            setModuleForm({ ...moduleForm, blocks: b });
                          }}
                          className="w-full p-2 text-xs border rounded-xl"
                        />
                      ) : (
                        <div className="space-y-2">
                          {block.content ? (
                            <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <span className="text-[10px] text-emerald-700 font-bold truncate flex-1">{block.content}</span>
                              <button
                                onClick={() => {
                                  const b = [...moduleForm.blocks];
                                  b[idx].content = "";
                                  setModuleForm({ ...moduleForm, blocks: b });
                                }}
                                className="text-[10px] text-rose-500 font-bold hover:underline whitespace-nowrap"
                              >
                                Quitar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                                <FileUp className="w-4 h-4" /> Subir {block.type === "video" ? "Video" : block.type === "image" ? "Imagen" : block.type === "pdf" ? "PDF" : "Presentación"}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept={
                                    block.type === "video" ? "video/*" :
                                    block.type === "image" ? "image/*" :
                                    block.type === "pdf" ? ".pdf" :
                                    ".pptx,.ppt,.key,.odp"
                                  }
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], idx)}
                                />
                              </label>
                              <span className="text-[10px] text-gray-400">o pega una URL</span>
                            </div>
                          )}
                          {block.content ? null : (
                            <input
                              type="text"
                              placeholder={`URL externa (${block.type})`}
                              value={block.content}
                              onChange={(e) => {
                                const b = [...moduleForm.blocks];
                                b[idx].content = e.target.value;
                                setModuleForm({ ...moduleForm, blocks: b });
                              }}
                              className="w-full p-2 text-xs border rounded-xl"
                            />
                          )}
                          <input
                            type="text"
                            placeholder="Leyenda / Título corto (opcional)"
                            aria-label="Leyenda del bloque"
                            value={block.caption || ""}
                            onChange={(e) => {
                              const b = [...moduleForm.blocks];
                              b[idx].caption = e.target.value;
                              setModuleForm({ ...moduleForm, blocks: b });
                            }}
                            className="w-full p-2 text-xs border rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* EVALUACIONES */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Evaluaciones ({moduleForm.evaluaciones.length})</h4>
                    </div>
                    <button
                      onClick={() =>
                        setModuleForm({
                          ...moduleForm,
                          evaluaciones: [
                            ...moduleForm.evaluaciones,
                            createDefaultEvaluation(moduleForm.evaluaciones.length)
                          ]
                        })
                      }
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Evaluación
                    </button>
                  </div>

                  {moduleForm.evaluaciones.map((evaluacion, evalIdx) => (
                    <div key={evalIdx} className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          placeholder="Título de la Evaluación"
                          aria-label="Título de la evaluación"
                          value={evaluacion.titulo}
                          onChange={(e) => {
                            const evs = [...moduleForm.evaluaciones];
                            evs[evalIdx].titulo = e.target.value;
                            setModuleForm({ ...moduleForm, evaluaciones: evs });
                          }}
                          className="px-2.5 py-1.5 bg-white border rounded-xl text-xs font-bold text-purple-900"
                        />

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span>Min:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              aria-label="Puntaje mínimo para aprobar"
                              value={evaluacion.min_score}
                              onChange={(e) => {
                                const evs = [...moduleForm.evaluaciones];
                                evs[evalIdx].min_score = Number(e.target.value);
                                setModuleForm({ ...moduleForm, evaluaciones: evs });
                              }}
                              className="w-14 px-2 py-1 bg-white border rounded-lg text-center font-bold"
                            />
                            <span>%</span>
                          </div>

                          {moduleForm.evaluaciones.length > 1 && (
                            <button
                              onClick={() => {
                                const evs = moduleForm.evaluaciones.filter((_, i) => i !== evalIdx);
                                setModuleForm({ ...moduleForm, evaluaciones: evs });
                              }}
                              aria-label={`Eliminar evaluación ${evalIdx + 1}`}
                              className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PREGUNTAS */}
                      <div className="space-y-3 pl-2">
                        {evaluacion.preguntas.map((q, qIdx) => (
                          <div key={qIdx} className="p-3 bg-white rounded-xl border space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-700">Pregunta #{qIdx + 1}</span>
                              <button
                                onClick={() => {
                                  const evs = [...moduleForm.evaluaciones];
                                  evs[evalIdx].preguntas = evs[evalIdx].preguntas.filter((_, i) => i !== qIdx);
                                  setModuleForm({ ...moduleForm, evaluaciones: evs });
                                }}
                                aria-label={`Eliminar pregunta ${qIdx + 1}`}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <input
                              type="text"
                              placeholder="Escribe la pregunta..."
                              aria-label="Texto de la pregunta"
                              value={q.question}
                              onChange={(e) => {
                                const evs = [...moduleForm.evaluaciones];
                                evs[evalIdx].preguntas[qIdx].question = e.target.value;
                                setModuleForm({ ...moduleForm, evaluaciones: evs });
                              }}
                              className="w-full p-2 border rounded-lg font-medium outline-none focus:border-purple-500"
                            />

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border">
                                  <input
                                    type="radio"
                                    name={`correct_${evalIdx}_${qIdx}`}
                                    checked={q.correct === optIdx}
                                    aria-label={`Marcar opción ${optIdx + 1} como correcta`}
                                    onChange={() => {
                                      const evs = [...moduleForm.evaluaciones];
                                      evs[evalIdx].preguntas[qIdx].correct = optIdx;
                                      setModuleForm({ ...moduleForm, evaluaciones: evs });
                                    }}
                                  />
                                  <input
                                    type="text"
                                    placeholder={`Opción ${optIdx + 1}`}
                                    aria-label={`Texto de la opción ${optIdx + 1}`}
                                    value={opt}
                                    onChange={(e) => {
                                      const evs = [...moduleForm.evaluaciones];
                                      evs[evalIdx].preguntas[qIdx].options[optIdx] = e.target.value;
                                      setModuleForm({ ...moduleForm, evaluaciones: evs });
                                    }}
                                    className="w-full bg-transparent border-none text-xs focus:outline-none"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* NUEVO CAMPO DE FEEDBACK / EXPLICACIÓN */}
                            <div className="pt-2 border-t border-gray-100">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                                <HelpCircle className="w-3 h-3 text-purple-600" />
                                Retroalimentación / Explicación (se muestra si falla la pregunta)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ej: Recuerda que la Participación Juvenil requiere asumir un rol activo en la toma de decisiones..."
                                value={q.explanation || ""}
                                onChange={(e) => {
                                  const evs = [...moduleForm.evaluaciones];
                                  evs[evalIdx].preguntas[qIdx].explanation = e.target.value;
                                  setModuleForm({ ...moduleForm, evaluaciones: evs });
                                }}
                                className="w-full p-2 bg-purple-50/40 border border-purple-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500 resize-none text-gray-700"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => {
                            const evs = [...moduleForm.evaluaciones];
                            evs[evalIdx].preguntas.push(createDefaultQuestion());
                            setModuleForm({ ...moduleForm, evaluaciones: evs });
                          }}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold text-xs hover:bg-purple-200 transition-colors"
                        >
                          + Agregar Pregunta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setModuleForm(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveModule}
                    disabled={uploading}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-colors"
                  >
                    {uploading ? "Guardando..." : "Guardar Módulo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={deleteCourseConfirm.open}
        onOpenChange={(open) => setDeleteCourseConfirm({ ...deleteCourseConfirm, open })}
        title="Eliminar Curso"
        description="¿Seguro que deseas eliminar este curso? Se eliminarán sus módulos y evaluaciones. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => {
          if (deleteCourseConfirm.courseId) handleDeleteCourse(Number(deleteCourseConfirm.courseId));
          setDeleteCourseConfirm({ open: false, courseId: null });
        }}
      />
      <ConfirmDialog
        open={deleteModuleConfirm.open}
        onOpenChange={(open) => setDeleteModuleConfirm({ ...deleteModuleConfirm, open })}
        title="Eliminar Módulo"
        description="¿Deseas eliminar este módulo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => {
          if (deleteModuleConfirm.moduleId) handleDeleteModule(deleteModuleConfirm.moduleId);
          setDeleteModuleConfirm({ open: false, moduleId: null });
        }}
      />
    </div>
  );
}
