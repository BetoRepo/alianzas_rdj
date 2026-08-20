import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, BookOpen, CheckCircle2, Trophy, ArrowRight, Lock } from "lucide-react";
import { getCourses, getUserDashboardStats, getUserProgress } from "../lib/courses";

interface CourseBadge {
  id: number;
  titulo: string;
  badge: string;
  totalModules: number;
  completedModules: number;
  isCompleted: boolean;
}

export default function InsigniasScreen({ userProfile }: { userProfile: any }) {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<CourseBadge[]>([]);
  const [stats, setStats] = useState({ completedCoursesCount: 0, totalCourses: 0, completedModulesCount: 0, totalModules: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBadges() {
      if (!userProfile?.id) return;
      setLoading(true);

      const [coursesData, dashboardStats, progressIds] = await Promise.all([
        getCourses(),
        getUserDashboardStats(userProfile.id),
        getUserProgress(userProfile.id),
      ]);

      setStats(dashboardStats);

      const courseBadges: CourseBadge[] = coursesData.map((course: any) => {
        const totalModules = course.total_modules || 0;
        const completedModules = progressIds.filter((id: number) => {
          return course.module_ids?.includes(id) || false;
        }).length;

        return {
          id: course.id,
          titulo: course.titulo || course.title || "Sin título",
          badge: course.badge || "Capacitación",
          totalModules,
          completedModules,
          isCompleted: totalModules > 0 && completedModules === totalModules,
        };
      });

      setBadges(courseBadges);
      setLoading(false);
    }

    loadBadges();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="p-5 space-y-5 animate-pulse">
        <div className="h-24 bg-purple-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const completedBadges = badges.filter((b) => b.isCompleted);
  const inProgressBadges = badges.filter((b) => !b.isCompleted && b.completedModules > 0);
  const pendingBadges = badges.filter((b) => b.completedModules === 0);

  return (
    <div className="p-5 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#622599] to-[#4a1c75] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="space-y-1 z-10 relative">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
            Mis Insignias
          </span>
          <h1 className="text-xl sm:text-2xl font-black">Insignias y Progreso</h1>
          <p className="text-xs text-white/70 max-w-md">
            Completa cursos para desbloquear insignias de logro y certificaciones Scout.
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-[#622599]">{stats.totalCourses}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Cursos Disponibles</p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-[#27742D]">{stats.completedCoursesCount}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Completados</p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-[#FBC02D]">{completedBadges.length}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Insignias</p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-[#1565C0]">{stats.completedModulesCount}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Módulos Totales</p>
        </div>
      </div>

      {/* Insignias Obtenidas */}
      {completedBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">Insignias Obtenidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-2xl border-2 border-[#FBC02D] p-5 shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 opacity-10">
                  <Trophy className="w-24 h-24 text-[#FBC02D]" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FBC02D] to-amber-400 flex items-center justify-center shadow-md">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-[#FBC02D]/20 text-amber-800 rounded-full text-[10px] font-black uppercase">
                      {badge.badge}
                    </span>
                  </div>
                </div>
                <h3 className="font-black text-gray-900 text-sm">{badge.titulo}</h3>
                <p className="text-[10px] text-gray-500 mt-1">
                  {badge.completedModules}/{badge.totalModules} módulos completados
                </p>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-[#FBC02D] h-1.5 rounded-full" style={{ width: "100%" }} />
                </div>
                <button
                  onClick={() => navigate(`/curso/${badge.id}`)}
                  className="mt-3 w-full py-2 bg-[#FBC02D]/10 hover:bg-[#FBC02D]/20 text-amber-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  Ver Curso <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* En Progreso */}
      {inProgressBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">En Progreso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressBadges.map((badge) => {
              const progress = badge.totalModules > 0
                ? Math.round((badge.completedModules / badge.totalModules) * 100)
                : 0;

              return (
                <div
                  key={badge.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#622599]/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#622599]" />
                    </div>
                    <span className="px-2 py-0.5 bg-[#622599]/10 text-[#622599] rounded-full text-[10px] font-black uppercase">
                      {badge.badge}
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 text-sm">{badge.titulo}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {badge.completedModules}/{badge.totalModules} módulos completados
                  </p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#27742D] h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-[#27742D] mt-1">{progress}% completado</p>
                  <button
                    onClick={() => navigate(`/curso/${badge.id}`)}
                    className="mt-3 w-full py-2 bg-[#622599] hover:bg-[#4a1c75] text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    Continuar <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pendientes */}
      {pendingBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">Sin Comenzar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm opacity-70 hover:opacity-100 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase">
                    {badge.badge}
                  </span>
                </div>
                <h3 className="font-black text-gray-900 text-sm">{badge.titulo}</h3>
                <p className="text-[10px] text-gray-500 mt-1">
                  {badge.totalModules} módulos
                </p>
                <button
                  onClick={() => navigate(`/curso/${badge.id}`)}
                  className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  Comenzar <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <Award className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-500">No hay cursos disponibles aún</p>
          <p className="text-xs text-gray-400">Los cursos aparecerán aquí cuando estén disponibles</p>
        </div>
      )}
    </div>
  );
}
