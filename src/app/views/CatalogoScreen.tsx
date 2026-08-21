import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Clock, ArrowRight, Award } from "lucide-react";
import { getCourses } from "../lib/courses";

export default function CatalogoScreen() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const data = await getCourses();
        setCourses(data || []);
      } catch (error) {
        console.error("Error cargando el catálogo:", error);
      } finally {
        setLoading(false);
      }
    }
    void loadCatalog();
  }, []);

  // Filtrado dinámico por título o descripción
  const filteredCourses = courses.filter((course) => {
    const title = (course.titulo || course.title || "").toLowerCase();
    const description = (course.descripcion || course.summary || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    return title.includes(query) || description.includes(query);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Cabecera y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
            Formación Continua
          </span>
          <h1 className="text-2xl font-black text-gray-900">Catálogo de Cursos</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Explora las capacitaciones disponibles y fortalece tus competencias.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar curso por título..."
            aria-label="Buscar cursos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 shadow-sm"
          />
        </div>
      </div>

      {/* Grid de Cursos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-3xl" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-xs font-bold text-gray-600">No se encontraron cursos</p>
          <p className="text-[10px] text-gray-400">Prueba con un término de búsqueda diferente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const title = course.titulo || course.title;
            const rawDesc = course.descripcion || course.summary;
            const desc = rawDesc && rawDesc.trim().length > 0
              ? rawDesc
              : "Explora este módulo para adquirir nuevas habilidades y fortalezas en tu área Scout.";
            const duration = course.duracion || course.duration || "1 hora";
            const cover = course.imagen_url || course.cover_image;

            return (
              <div
                key={course.id}
                onClick={() => navigate(`/curso/${course.id}`)}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {cover && (
                    <img
                      src={cover}
                      alt={title}
                      className="w-full h-36 object-cover rounded-2xl"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 uppercase">
                      {course.badge || "Especialidad"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {duration}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-sm group-hover:text-purple-600 transition-colors leading-snug">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" /> Ver Programa
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}