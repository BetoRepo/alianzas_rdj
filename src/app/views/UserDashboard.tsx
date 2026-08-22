import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Trophy, CheckCircle2, ArrowRight, Award, Compass } from "lucide-react";
import { getCourses, getUserDashboardStats } from "../lib/courses";

export default function UserDashboard({ userProfile }: { userProfile: any }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>({
    completedCoursesCount: 0,
    totalCourses: 0,
    completedModulesCount: 0,
    totalModules: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!userProfile?.id) return;
      setLoading(true);

      const [dashboardStats, coursesData] = await Promise.all([
        getUserDashboardStats(userProfile.id),
        getCourses(),
      ]);

      setStats(dashboardStats || {});
      setCourses((coursesData || []).slice(0, 3));
      setLoading(false);
    }

    void loadDashboardData();
  }, [userProfile]);

  const progressPercentage =
    stats.totalModules > 0
      ? Math.round((stats.completedModulesCount / stats.totalModules) * 100)
      : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-32 bg-purple-100 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Imagen de fondo */}
        <img
          src="/images/scout-banner.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        />
        <div className="space-y-1.5 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-200 bg-purple-950/40 px-3 py-1 rounded-full border border-purple-400/20">
            Siempre Listos
          </span>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>
            ¡Hola, {userProfile?.name || "Scout"}! 👋
          </h1>
          <p className="text-xs text-purple-100 max-w-md leading-relaxed">
            Avanza en tus módulos de aprendizaje y completa tus insignias de especialidad.
          </p>
        </div>

        <button
          onClick={() => navigate("/catalogo")}
          className="z-10 bg-white text-purple-900 hover:bg-purple-50 px-5 py-3 rounded-2xl text-xs font-black shadow-md flex items-center gap-2 transition-all shrink-0"
        >
          Explorar Cursos <Compass className="w-4 h-4 text-purple-700" />
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cursos Disponibles</p>
            <h3 className="text-xl font-black text-gray-900">{stats.totalCourses || 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Insignias Desbloqueadas</p>
            <h3 className="text-xl font-black text-gray-900">{stats.completedCoursesCount || 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progreso Global</p>
              <h3 className="text-lg font-black text-gray-900">{progressPercentage}%</h3>
            </div>
          </div>
          
          {/* Barra de Progreso Visual */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Sección de Cursos Recomendados */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" /> Cursos Destacados
          </h2>
          <button
            onClick={() => navigate("/catalogo")}
            className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
          >
            Ver catálogo completo <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-xs text-gray-400">
            No hay cursos publicados de momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const title = course.titulo || course.title;
              const desc = course.descripcion || course.summary || "Capacitación formativa para desarrollo de competencias Scout.";

              return (
                <div
                  key={course.id}
                  onClick={() => navigate(`/curso/${course.id}`)}
                  className="bg-white rounded-3xl border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 uppercase tracking-wide">
                      {course.badge || "Formación"}
                    </span>
                    <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-purple-700 transition-colors leading-snug">
                      {title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-purple-600">
                    <span>Ir al curso</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}