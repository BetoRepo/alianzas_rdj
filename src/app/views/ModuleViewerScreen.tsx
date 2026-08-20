import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { 
  getModuleById, 
  markModuleAsCompleted, 
  getModulesByCourseId, 
  getUserProgress 
} from "../lib/courses";

export default function ModuleViewerScreen({ userProfile }: { userProfile?: any }) {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkAccessAndLoad() {
      if (!moduleId || !courseId || !userProfile?.id) return;
      setLoading(true);

      const [modulesData, progressData] = await Promise.all([
        getModulesByCourseId(courseId),
        getUserProgress(userProfile.id)
      ]);

      const currentIndex = modulesData.findIndex((m) => m.id === moduleId);
      
      // Si no es el primer módulo y el módulo anterior no está completado -> Bloquear acceso
      if (currentIndex > 0) {
        const previousModuleId = modulesData[currentIndex - 1].id;
        const isPreviousCompleted = progressData.includes(previousModuleId);

        if (!isPreviousCompleted) {
          toast.warning("Debes completar el módulo anterior antes de acceder a este.");
          navigate(`/curso/${courseId}`);
          return;
        }
      }

      // Comprobar si el módulo actual ya estaba completado
      if (progressData.includes(moduleId)) {
        setCompleted(true);
      }

      const data = await getModuleById(moduleId);
      setModuleData(data);
      setLoading(false);
    }

    checkAccessAndLoad();
  }, [moduleId, courseId, userProfile, navigate]);

  async function handleComplete() {
    if (!userProfile?.id || !moduleId) return;
    setSubmitting(true);
    const success = await markModuleAsCompleted(userProfile.id, moduleId);
    if (success) setCompleted(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="p-5 space-y-4 animate-pulse max-w-4xl mx-auto">
        <div className="h-6 bg-gray-200 rounded w-36" />
        <div className="h-64 bg-purple-50 rounded-2xl" />
        <div className="h-20 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="p-5 text-center space-y-4">
        <p className="text-sm font-bold text-gray-600">No se encontró el contenido del módulo.</p>
        <button
          onClick={() => navigate(`/curso/${courseId}`)}
          className="text-xs font-bold text-purple-600 underline"
        >
          Volver al curso
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(`/curso/${courseId}`)}
        className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver al curso
      </button>

      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase tracking-wider">
              Lección Activa
            </span>
            <h1 className="text-xl font-black text-gray-900 mt-2">{moduleData.titulo}</h1>
          </div>
          {completed && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Completado
            </span>
          )}
        </div>

        {moduleData.video_url && (
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
            <iframe
              src={moduleData.video_url}
              title={moduleData.titulo}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        <div className="prose prose-purple max-w-none text-xs text-gray-600 leading-relaxed space-y-3 pt-2">
          {moduleData.contenido ? (
            <p className="whitespace-pre-line">{moduleData.contenido}</p>
          ) : (
            <p className="italic text-gray-400">
              Este módulo no contiene texto descriptivo. Revisa el material adjunto o el video interactivo.
            </p>
          )}
        </div>

        {moduleData.archivo_url && (
          <div className="border rounded-xl p-4 flex items-center justify-between bg-purple-50/50">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-gray-800">Material Adjunto (PDF/Documento)</p>
                <p className="text-[10px] text-gray-400">Descarga la guía de apoyo de este módulo.</p>
              </div>
            </div>
            <a
              href={moduleData.archivo_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-purple-600 hover:underline"
            >
              Descargar
            </a>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-xs font-black text-gray-800">¿Finalizaste este tema?</h3>
          <p className="text-[10px] text-gray-400">Regístralo para actualizar tus insignias y porcentaje global.</p>
        </div>
        <button
          onClick={handleComplete}
          disabled={completed || submitting}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all w-full sm:w-auto justify-center ${
            completed
              ? "bg-emerald-100 text-emerald-700 cursor-default"
              : "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Tema Completado
            </>
          ) : (
            <>
              {submitting ? "Guardando..." : "Marcar como Completado"}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}