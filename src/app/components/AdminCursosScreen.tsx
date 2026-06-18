import { useState, useEffect } from "react";
import { PlusCircle, Edit3, Trash2, Star, X } from "lucide-react";
import { supabase } from "../lib/supabase";

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
    const { error } = await supabase.from("cursos").insert([{
      title,
      category,
      description,
      duration,
      img: img || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400"
    }]);

    if (error) alert(error.message);
    else {
      setShowModal(false);
      fetchCourses();
      // Resetear campos
      setTitle(""); setDescription(""); setDuration(""); setImg("");
    }
  }

  async function handleDeleteCourse(id: number) {
    if (confirm("¿Estás seguro de que quieres eliminar este curso? Se borrarán todos sus módulos vinculados.")) {
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (!error) setCourses(courses.filter(c => c.id !== id));
    }
  }

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Gestión de contenido</p>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>Cursos</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
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
                <button onClick={() => handleDeleteCourse(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                Publicar Curso en la Red
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}