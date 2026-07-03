import { useState, useEffect } from "react";
import { PlusCircle, Edit3, Trash2, Star, X } from "lucide-react";
import { supabase } from "../lib/supabase";

interface QuizItem {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ModuleForm {
  title: string;
  duration: string;
  content: string;
  quiz: QuizItem[];
}

const defaultModule: ModuleForm = {
  title: "",
  duration: "",
  content: "",
  quiz: [
    { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }
  ]
};

export function AdminCursosScreen() {
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Campos del Formulario
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Liderazgo");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [img, setImg] = useState("");

  const [selectedCourseForModules, setSelectedCourseForModules] = useState<any>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDuration, setModuleDuration] = useState("");
  const [moduleContent, setModuleContent] = useState("");
  const [moduleLoading, setModuleLoading] = useState(false);

  const [modulesInForm, setModulesInForm] = useState<ModuleForm[]>([{ ...defaultModule }]);

  function openCourseModal() {
    setModulesInForm([{ ...defaultModule }]);
    setShowModal(true);
  }

  function closeCourseModal() {
    setShowModal(false);
    setModulesInForm([{ ...defaultModule }]);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase.from("cursos").select("*").order("created_at", { ascending: false });
    if (!error && data) setCourses(data);
    setLoading(false);
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.from("cursos").insert([{
      title,
      category,
      description,
      duration,
      img: img || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400"
    }]).select("id").single();

    if (error) {
      alert(error.message);
      return;
    }

    const courseId = data?.id;
    if (courseId) {
      const modulesToInsert = modulesInForm
        .filter((m) => m.title.trim() || m.content.trim())
        .map((m, idx) => ({
          curso_id: courseId,
          title: m.title,
          duration: m.duration,
          content: JSON.stringify([{ type: "text", content: m.content || "" }]),
          quiz: JSON.stringify(
            m.quiz
              .filter((q) => q.question.trim())
              .map((q) => ({
                question: q.question,
                options: q.options,
                correct: Number(q.correct),
                explanation: q.explanation
              }))
          ),
          orden: idx + 1
        }));

      if (modulesToInsert.length > 0) {
        const { error: moduleError } = await supabase.from("modulos").insert(modulesToInsert);
        if (moduleError) {
          alert(moduleError.message);
        }
      }
    }

    setShowModal(false);
    fetchCourses();
    // Resetear campos
    setTitle(""); setDescription(""); setDuration(""); setImg("");
    setModulesInForm([{ ...defaultModule }]);
  }

  async function handleDeleteCourse(id: number) {
    if (confirm("¿Estás seguro de que quieres eliminar este curso? Se borrarán todos sus módulos vinculados.")) {
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (!error) setCourses(courses.filter(c => c.id !== id));
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
    fetchModules(course.id);
  }

  function closeModuleManager() {
    setSelectedCourseForModules(null);
    setCourseModules([]);
    setModuleTitle("");
    setModuleDuration("");
    setModuleContent("");
  }

  async function handleCreateModule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourseForModules) return;

    const { error } = await supabase.from("modulos").insert([{
      curso_id: selectedCourseForModules.id,
      title: moduleTitle,
      duration: moduleDuration,
      content: JSON.stringify([{ type: "text", content: moduleContent || "Contenido inicial del módulo." }]),
      quiz: JSON.stringify([]),
      orden: courseModules.length + 1
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setModuleTitle("");
    setModuleDuration("");
    setModuleContent("");
    fetchModules(selectedCourseForModules.id);
  }

  async function handleDeleteModule(moduleId: number) {
    if (!selectedCourseForModules) return;
    if (!confirm("¿Eliminar este módulo?")) return;
    const { error } = await supabase.from("modulos").delete().eq("id", moduleId);
    if (!error) {
      setCourseModules(courseModules.filter((m) => m.id !== moduleId));
    }
  }

  function addModuleField() {
    setModulesInForm((prev) => [...prev, { ...defaultModule }]);
  }

  function removeModuleField(index: number) {
    setModulesInForm((prev) => prev.filter((_, i) => i !== index));
  }

  function updateModuleField(index: number, field: keyof Omit<ModuleForm, "quiz">, value: string) {
    setModulesInForm((prev) => prev.map((module, i) => i === index ? { ...module, [field]: value } : module));
  }

  function addQuizQuestion(moduleIndex: number) {
    setModulesInForm((prev) => prev.map((module, i) => i === moduleIndex ? {
      ...module,
      quiz: [...module.quiz, { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }]
    } : module));
  }

  function removeQuizQuestion(moduleIndex: number, questionIndex: number) {
    setModulesInForm((prev) => prev.map((module, i) => i === moduleIndex ? {
      ...module,
      quiz: module.quiz.filter((_, q) => q !== questionIndex)
    } : module));
  }

  function updateQuizField(moduleIndex: number, questionIndex: number, field: keyof QuizItem, value: string | number, optionIndex?: number) {
    setModulesInForm((prev) => prev.map((module, i) => {
      if (i !== moduleIndex) return module;
      return {
        ...module,
        quiz: module.quiz.map((question, q) => {
          if (q !== questionIndex) return question;
          if (field === "options" && typeof optionIndex === "number") {
            const nextOptions = [...question.options];
            nextOptions[optionIndex] = String(value);
            return { ...question, options: nextOptions };
          }
          return { ...question, [field]: value };
        })
      };
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
          courses.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border flex items-center gap-4 p-4 hover:shadow-sm transition-all" style={{ borderColor: "rgba(91,33,182,0.08)" }}>
              <img src={c.img} alt={c.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f3f0ff", color: "#7c3aed" }}>{c.category}</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-600"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{c.rating}</span>
                </div>
                <div className="text-sm font-bold text-gray-800 truncate">{c.title}</div>
                <div className="text-xs text-gray-400">{c.duration}</div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => openModuleManager(c)} className="px-3 py-2 rounded-xl text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-50 transition-all">Módulos</button>
                <button onClick={() => handleDeleteCourse(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
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
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Título de la Insignia o Curso</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Pionerismo y Nudos" className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                  <option value="Liderazgo">Liderazgo</option>
                  <option value="Supervivencia">Supervivencia</option>
                  <option value="Valores">Valores</option>
                  <option value="Naturaleza">Naturaleza</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Duración Estimada</label>
                <input required type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ej: 6 semanas" className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL de la Imagen de Portada</label>
                <input type="text" value={img} onChange={e => setImg(e.target.value)} placeholder="https://unsplash.com/..." className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción del Plan de Estudios</label>
                <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>

              <div className="space-y-4 bg-slate-50 rounded-3xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Módulos</p>
                    <p className="text-sm font-black text-gray-900">Define el plan de estudios y su evaluación</p>
                  </div>
                  <button type="button" onClick={addModuleField} className="text-xs font-bold text-purple-700 hover:text-purple-900">+ Agregar módulo</button>
                </div>
                {modulesInForm.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="space-y-3 bg-white rounded-3xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Módulo {moduleIndex + 1}</p>
                        <h4 className="text-sm font-black text-gray-900 truncate">{module.title || "Nuevo módulo"}</h4>
                      </div>
                      {modulesInForm.length > 1 && (
                        <button type="button" onClick={() => removeModuleField(moduleIndex)} className="text-xs font-semibold text-red-600 hover:text-red-800">Eliminar módulo</button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input required type="text" value={module.title} onChange={e => updateModuleField(moduleIndex, "title", e.target.value)} placeholder="Título del módulo" className="w-full px-3 py-2 border rounded-xl text-sm" />
                      <input required type="text" value={module.duration} onChange={e => updateModuleField(moduleIndex, "duration", e.target.value)} placeholder="Duración" className="w-full px-3 py-2 border rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Contenido del módulo</label>
                      <textarea rows={3} value={module.content} onChange={e => updateModuleField(moduleIndex, "content", e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Breve descripción del módulo." />
                    </div>
                    <div className="space-y-3 bg-slate-50 rounded-3xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-gray-900">Evaluación</p>
                        <button type="button" onClick={() => addQuizQuestion(moduleIndex)} className="text-xs font-bold text-purple-700 hover:text-purple-900">+ Agregar pregunta</button>
                      </div>
                      {module.quiz.map((question, questionIndex) => (
                        <div key={questionIndex} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-gray-500">Pregunta {questionIndex + 1}</p>
                            {module.quiz.length > 1 && (
                              <button type="button" onClick={() => removeQuizQuestion(moduleIndex, questionIndex)} className="text-xs text-red-600 hover:text-red-800">Eliminar</button>
                            )}
                          </div>
                          <input required type="text" value={question.question} onChange={e => updateQuizField(moduleIndex, questionIndex, "question", e.target.value)} placeholder="Enunciado de la pregunta" className="w-full px-3 py-2 border rounded-xl text-sm" />
                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.options.map((option, optionIndex) => (
                              <input key={optionIndex} required type="text" value={option} onChange={e => updateQuizField(moduleIndex, questionIndex, "options", e.target.value, optionIndex)} placeholder={`Opción ${optionIndex + 1}`} className="w-full px-3 py-2 border rounded-xl text-sm" />
                            ))}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <select value={question.correct} onChange={e => updateQuizField(moduleIndex, questionIndex, "correct", Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                              <option value={0}>Respuesta correcta: Opción 1</option>
                              <option value={1}>Respuesta correcta: Opción 2</option>
                              <option value={2}>Respuesta correcta: Opción 3</option>
                              <option value={3}>Respuesta correcta: Opción 4</option>
                            </select>
                            <input required type="text" value={question.explanation} onChange={e => updateQuizField(moduleIndex, questionIndex, "explanation", e.target.value)} placeholder="Explicación de la respuesta" className="w-full px-3 py-2 border rounded-xl text-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                Publicar Curso en la Red
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
                          <button onClick={() => handleDeleteModule(mod.id)} className="text-xs font-semibold text-red-600 hover:text-red-800">Eliminar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleCreateModule} className="space-y-4 bg-white rounded-3xl p-4 border border-gray-200">
                  <h3 className="text-sm font-black text-gray-900">Agregar módulo nuevo</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Título del módulo</label>
                    <input required type="text" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Ej: Primeros Auxilios" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Duración</label>
                    <input required type="text" value={moduleDuration} onChange={e => setModuleDuration(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Ej: 45 min" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Contenido inicial</label>
                    <textarea rows={4} value={moduleContent} onChange={e => setModuleContent(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Describe brevemente el contenido del módulo." />
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