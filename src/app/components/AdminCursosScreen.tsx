import { useEffect, useState, type FormEvent } from "react";
import { PlusCircle, Trash2, Star, X, Image as ImageIcon, Video as VideoIcon, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";

interface QuizItem {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ContentBlock {
  type: "text" | "image" | "video";
  content: string;
  caption?: string;
}

interface ModuleForm {
  title: string;
  duration: string;
  blocks: ContentBlock[];
  quiz: QuizItem[];
}

function createDefaultModule(): ModuleForm {
  return {
    title: "",
    duration: "",
    blocks: [{ type: "text", content: "", caption: "" }],
    quiz: [{ question: "", options: ["", "", "", ""], correct: 0, explanation: "" }]
  };
}

function normalizeBlocks(blocks: ContentBlock[]) {
  return blocks
    .map((block) => ({
      type: block.type === "image" || block.type === "video" ? block.type : "text",
      content: block.content || "",
      caption: block.caption || ""
    }))
    .filter((block) => block.content.trim() || block.caption?.trim());
}

function buildQuizPayload(quiz: QuizItem[]) {
  return quiz
    .filter((question) => question.question.trim())
    .map((question) => ({
      question: question.question,
      options: question.options,
      correct: Number(question.correct),
      explanation: question.explanation
    }));
}

export function AdminCursosScreen() {
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Liderazgo");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [img, setImg] = useState("");

  const [selectedCourseForModules, setSelectedCourseForModules] = useState<any>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(createDefaultModule());

  function resetCourseForm() {
    setTitle("");
    setCategory("Liderazgo");
    setDescription("");
    setDuration("");
    setImg("");
  }

  function openCourseModal() {
    resetCourseForm();
    setShowModal(true);
  }

  function closeCourseModal() {
    setShowModal(false);
    resetCourseForm();
  }

  useEffect(() => {
    void fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase.from("cursos").select("*").order("created_at", { ascending: false });
    if (!error && data) setCourses(data);
    setLoading(false);
  }

  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase.from("cursos").insert([{
      title,
      category,
      description,
      duration,
      img: img || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400"
    }]).select("id, title, category, description, duration, img").single();

    if (error) {
      alert(error.message);
      return;
    }

    if (data?.id) {
      setShowModal(false);
      setSelectedCourseForModules({
        id: data.id,
        title: data.title || title,
        category: data.category || category,
        description: data.description || description,
        duration: data.duration || duration,
        img: data.img || img || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400"
      });
      setCourseModules([]);
      setModuleForm(createDefaultModule());
    }

    await fetchCourses();
    resetCourseForm();
  }

  async function handleDeleteCourse(id: number) {
    if (!confirm("¿Estás seguro de que quieres eliminar este curso? Se borrarán todos sus módulos vinculados.")) return;

    const { error: moduleError } = await supabase.from("modulos").delete().eq("curso_id", id);
    if (moduleError) {
      alert(moduleError.message);
      return;
    }

    const { error } = await supabase.from("cursos").delete().eq("id", id);
    if (!error) {
      setCourses((prev) => prev.filter((course) => course.id !== id));
    }
  }

  async function fetchModules(courseId: number) {
    setModuleLoading(true);
    const { data, error } = await supabase.from("modulos").select("*").eq("curso_id", courseId).order("orden", { ascending: true });
    if (!error && data) {
      setCourseModules(data);
    } else {
      setCourseModules([]);
    }
    setModuleLoading(false);
  }

  function openModuleManager(course: any) {
    setSelectedCourseForModules(course);
    setModuleForm(createDefaultModule());
    void fetchModules(course.id);
  }

  function closeModuleManager() {
    setSelectedCourseForModules(null);
    setCourseModules([]);
    setModuleForm(createDefaultModule());
  }

  async function handleCreateModule(e: FormEvent) {
    e.preventDefault();
    if (!selectedCourseForModules) return;

    const { error } = await supabase.from("modulos").insert([{
      curso_id: selectedCourseForModules.id,
      title: moduleForm.title,
      duration: moduleForm.duration,
      content: JSON.stringify(normalizeBlocks(moduleForm.blocks)),
      quiz: JSON.stringify(buildQuizPayload(moduleForm.quiz)),
      orden: courseModules.length + 1
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setModuleForm(createDefaultModule());
    await fetchModules(selectedCourseForModules.id);
    await fetchCourses();
  }

  async function handleDeleteModule(moduleId: number) {
    if (!selectedCourseForModules) return;
    if (!confirm("¿Eliminar este módulo?")) return;

    const { error } = await supabase.from("modulos").delete().eq("id", moduleId);
    if (!error) {
      setCourseModules((prev) => prev.filter((module) => module.id !== moduleId));
      await fetchCourses();
    }
  }

  function addBlockToModuleForm() {
    setModuleForm((prev) => ({ ...prev, blocks: [...prev.blocks, { type: "text", content: "", caption: "" }] }));
  }

  function removeBlockFromModuleForm(blockIndex: number) {
    setModuleForm((prev) => ({ ...prev, blocks: prev.blocks.filter((_, index) => index !== blockIndex) }));
  }

  function updateModuleBlock(blockIndex: number, field: keyof ContentBlock, value: string) {
    setModuleForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, index) => index === blockIndex ? { ...block, [field]: value } : block)
    }));
  }

  function updateModuleBlockType(blockIndex: number, type: ContentBlock["type"]) {
    setModuleForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, index) => index === blockIndex ? { ...block, type, content: block.type === type ? block.content : "", caption: block.type === type ? block.caption : "" } : block)
    }));
  }

  function addQuizQuestion() {
    setModuleForm((prev) => ({
      ...prev,
      quiz: [...prev.quiz, { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }]
    }));
  }

  function removeQuizQuestion(questionIndex: number) {
    setModuleForm((prev) => ({
      ...prev,
      quiz: prev.quiz.filter((_, index) => index !== questionIndex)
    }));
  }

  function updateQuizField(questionIndex: number, field: keyof QuizItem, value: string | number, optionIndex?: number) {
    setModuleForm((prev) => ({
      ...prev,
      quiz: prev.quiz.map((question, index) => {
        if (index !== questionIndex) return question;
        if (field === "options" && typeof optionIndex === "number") {
          const nextOptions = [...question.options];
          nextOptions[optionIndex] = String(value);
          return { ...question, options: nextOptions };
        }
        return { ...question, [field]: value };
      })
    }));
  }

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Gestión de contenido</p>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>Cursos</h1>
        </div>
        <button
          onClick={openCourseModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
          style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
        >
          <PlusCircle className="w-4 h-4" /> Nuevo Curso
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Cargando catálogo...</div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border flex items-center gap-4 p-4 hover:shadow-sm transition-all" style={{ borderColor: "rgba(91,33,182,0.08)" }}>
              <img src={course.img} alt={course.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f3f0ff", color: "#7c3aed" }}>{course.category}</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-600"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(course.rating) || 0}</span>
                </div>
                <div className="text-sm font-bold text-gray-800 truncate">{course.title}</div>
                <div className="text-xs text-gray-400">{course.duration}</div>
                <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">{course.description}</div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => openModuleManager(course)} className="px-3 py-2 rounded-xl text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-50 transition-all">Módulos</button>
                <button onClick={() => void handleDeleteCourse(course.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={closeCourseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-black text-gray-900 mb-4" style={{ fontFamily: "Nunito, sans-serif" }}>Crear Nuevo Curso Scout</h2>
            <p className="text-sm text-gray-500 mb-4">Crea el curso primero y luego añade sus módulos con texto, imágenes o videos.</p>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Título de la Insignia o Curso</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Pionerismo y Nudos" className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                  <option value="Liderazgo">Liderazgo</option>
                  <option value="Supervivencia">Supervivencia</option>
                  <option value="Valores">Valores</option>
                  <option value="Naturaleza">Naturaleza</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Duración Estimada</label>
                <input required type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ej: 6 semanas" className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL de la Imagen de Portada</label>
                <input type="text" value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://unsplash.com/..." className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción del Plan de Estudios</label>
                <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                Crear Curso y Preparar Módulos
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedCourseForModules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={closeModuleManager} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-black text-gray-900 mb-4" style={{ fontFamily: "Nunito, sans-serif" }}>Módulos de {selectedCourseForModules.title}</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-3xl p-4 border border-gray-200">
                  <h3 className="text-sm font-black text-gray-900 mb-3">Módulos existentes</h3>
                  {moduleLoading ? (
                    <p className="text-xs text-gray-500">Cargando módulos...</p>
                  ) : courseModules.length === 0 ? (
                    <p className="text-xs text-gray-500">Este curso aún no tiene módulos.</p>
                  ) : (
                    <div className="space-y-3">
                      {courseModules.map((mod) => (
                        <div key={mod.id} className="flex items-center justify-between gap-3 bg-white rounded-2xl border p-3">
                          <div>
                            <div className="text-sm font-bold text-gray-800">{mod.title}</div>
                            <div className="text-xs text-gray-400">{mod.duration}</div>
                          </div>
                          <button onClick={() => void handleDeleteModule(mod.id)} className="text-xs font-semibold text-red-600 hover:text-red-800">Eliminar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleCreateModule} className="space-y-4 bg-white rounded-3xl p-4 border border-gray-200">
                  <h3 className="text-sm font-black text-gray-900">Agregar módulo nuevo</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Título del módulo</label>
                      <input required type="text" value={moduleForm.title} onChange={(e) => setModuleForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Ej: Primeros Auxilios" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Duración</label>
                      <input required type="text" value={moduleForm.duration} onChange={(e) => setModuleForm((prev) => ({ ...prev, duration: e.target.value }))} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Ej: 45 min" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-gray-900">Contenido del módulo</p>
                      <button type="button" onClick={addBlockToModuleForm} className="text-xs font-bold text-purple-700 hover:text-purple-900">+ Añadir bloque</button>
                    </div>
                    {moduleForm.blocks.map((block, index) => (
                      <div key={index} className="rounded-2xl border border-gray-200 bg-slate-50 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                            <FileText className="w-3.5 h-3.5" /> Bloque {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <select value={block.type} onChange={(e) => updateModuleBlockType(index, e.target.value as ContentBlock["type"])} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs">
                              <option value="text">Texto</option>
                              <option value="image">Imagen</option>
                              <option value="video">Video</option>
                            </select>
                            {moduleForm.blocks.length > 1 && (
                              <button type="button" onClick={() => removeBlockFromModuleForm(index)} className="text-xs text-red-600">Eliminar</button>
                            )}
                          </div>
                        </div>

                        {block.type === "text" && (
                          <textarea rows={4} value={block.content} onChange={(e) => updateModuleBlock(index, "content", e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Explica el contenido del bloque o añade un resumen." />
                        )}

                        {block.type === "image" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><ImageIcon className="w-3.5 h-3.5" /> Enlace de imagen</div>
                            <input type="text" value={block.content} onChange={(e) => updateModuleBlock(index, "content", e.target.value)} placeholder="https://.../imagen.jpg" className="w-full px-3 py-2 border rounded-xl text-sm" />
                            <input type="text" value={block.caption || ""} onChange={(e) => updateModuleBlock(index, "caption", e.target.value)} placeholder="Pie de imagen (opcional)" className="w-full px-3 py-2 border rounded-xl text-sm" />
                          </div>
                        )}

                        {block.type === "video" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><VideoIcon className="w-3.5 h-3.5" /> Enlace o ID de video</div>
                            <input type="text" value={block.content} onChange={(e) => updateModuleBlock(index, "content", e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 border rounded-xl text-sm" />
                            <input type="text" value={block.caption || ""} onChange={(e) => updateModuleBlock(index, "caption", e.target.value)} placeholder="Descripción del video (opcional)" className="w-full px-3 py-2 border rounded-xl text-sm" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-gray-900">Evaluación opcional</p>
                      <button type="button" onClick={addQuizQuestion} className="text-xs font-bold text-purple-700 hover:text-purple-900">+ Añadir pregunta</button>
                    </div>
                    {moduleForm.quiz.map((question, questionIndex) => (
                      <div key={questionIndex} className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-gray-500">Pregunta {questionIndex + 1}</p>
                          {moduleForm.quiz.length > 1 && (
                            <button type="button" onClick={() => removeQuizQuestion(questionIndex)} className="text-xs text-red-600">Eliminar</button>
                          )}
                        </div>
                        <input type="text" value={question.question} onChange={(e) => updateQuizField(questionIndex, "question", e.target.value)} placeholder="Enunciado de la pregunta" className="w-full px-3 py-2 border rounded-xl text-sm" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <input key={optionIndex} type="text" value={option} onChange={(e) => updateQuizField(questionIndex, "options", e.target.value, optionIndex)} placeholder={`Opción ${optionIndex + 1}`} className="w-full px-3 py-2 border rounded-xl text-sm" />
                          ))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select value={question.correct} onChange={(e) => updateQuizField(questionIndex, "correct", Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                            <option value={0}>Respuesta correcta: Opción 1</option>
                            <option value={1}>Respuesta correcta: Opción 2</option>
                            <option value={2}>Respuesta correcta: Opción 3</option>
                            <option value={3}>Respuesta correcta: Opción 4</option>
                          </select>
                          <input type="text" value={question.explanation} onChange={(e) => updateQuizField(questionIndex, "explanation", e.target.value)} placeholder="Explicación de la respuesta" className="w-full px-3 py-2 border rounded-xl text-sm" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                    Crear Módulo
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

