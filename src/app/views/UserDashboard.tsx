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

      setStats(dashboardStats);
      setCourses(coursesData.slice(0, 3)); // Mostrar máximo 3 en el dashboard
      setLoading(false);
    }

    loadDashboardData();
  }, [userProfile]);

  const progressPercentage =
    stats.totalModules > 0
      ? Math.round((stats.completedModulesCount / stats.totalModules) * 100)
      : 0;

  if (loading) {
    return (
      <div className="p-5 space-y-5 animate-pulse">
        <div className="h-28 bg-purple-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6 animate-fade-in">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-purple-800 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-200 bg-purple-900/40 px-2.5 py-1 rounded-full">
            Siempre Listos
          </span>
          <h1 className="text-xl sm:text-2xl font-black">¡Hola, {userProfile?.name || "Scout"}! 👋</h1>
          <p className="text-xs text-purple-100 max-w-md">
            Continúa con tus módulos de formación y desbloquea nuevas insignias para tu especialidad.
          </p>
        </div>
        <button
          onClick={() => navigate("/catalogo")}
          className="z-10 bg-white text-purple-800 hover:bg-purple-50 px-4 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all shrink-0"
        >
          Explorar Cursos <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Cursos Totales</p>
            <h3 className="text-lg font-black text-gray-800">{stats.totalCourses}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Insignias Desbloqueadas</p>
            <h3 className="text-lg font-black text-gray-800">{stats.completedCoursesCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Progreso Global</p>
            <h3 className="text-lg font-black text-gray-800">{progressPercentage}%</h3>
          </div>
        </div>
      </div>

      {/* Sección de Cursos Disponibles / Destacados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" /> Cursos Recomendados
          </h2>
          <button
            onClick={() => navigate("/catalogo")}
            className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border p-6 text-center text-xs text-gray-400">
            Aún no hay cursos creados en la plataforma.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/curso/${course.id}`)}
                className="bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 uppercase">
                    Formación
                  </span>
                  <h3 className="font-black text-gray-800 text-sm group-hover:text-purple-700 transition-colors">
                    {course.titulo}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{course.descripcion}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span>Ir al curso</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}