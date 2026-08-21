import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, ChevronRight, ChevronLeft, Image as ImageIcon, Play } from "lucide-react";
import { toast } from "sonner";
import {
  getModuleById,
  markModuleAsCompleted,
  getModulesByCourseId,
  getUserProgress
} from "../lib/courses";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface Slide {
  id: number;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "pdf" | "video";
}

interface ModuleData {
  id: string;
  titulo: string;
  contenido?: string;
  archivo_url?: string;
  video_url?: string;
  slides?: Slide[];
}

export default function ModuleViewerScreen({ userProfile }: { userProfile?: any }) {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function checkAccessAndLoad() {
      if (!moduleId || !courseId || !userProfile?.id) return;
      setLoading(true);

      const [modulesData, progressData] = await Promise.all([
        getModulesByCourseId(courseId),
        getUserProgress(userProfile.id)
      ]);

      const currentIndex = modulesData.findIndex((m) => m.id === moduleId);

      if (currentIndex > 0) {
        const previousModuleId = modulesData[currentIndex - 1].id;
        const isPreviousCompleted = progressData.includes(previousModuleId);
        if (!isPreviousCompleted) {
          toast.warning("Debes completar el modulo anterior antes de acceder a este.");
          navigate(`/curso/${courseId}`);
          return;
        }
      }

      if (progressData.includes(moduleId)) setCompleted(true);

      const data = await getModuleById(moduleId);
      setModuleData(data);
      setLoading(false);
    }

    checkAccessAndLoad();
  }, [moduleId, courseId, userProfile, navigate]);

  const handleComplete = useCallback(async () => {
    if (!userProfile?.id || !moduleId) return;
    setSubmitting(true);
    const success = await markModuleAsCompleted(userProfile.id, moduleId);
    if (success) setCompleted(true);
    setSubmitting(false);
  }, [userProfile?.id, moduleId]);

  // Navigation with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!moduleData?.slides) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [moduleData, currentSlide]);

  const slides = moduleData?.slides || [];
  const hasSlides = slides.length > 0;
  const totalSlides = slides.length;

  function goToNext() {
    if (currentSlide < totalSlides - 1) setCurrentSlide(prev => prev + 1);
  }

  function goToPrev() {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  }

  if (loading) {
    return (
      <div className="p-5 max-w-4xl mx-auto">
        <LoadingSpinner text="Cargando modulo..." />
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="p-5 text-center space-y-4">
        <p className="text-sm font-bold text-gray-600">No se encontro el contenido del modulo.</p>
        <button onClick={() => navigate(`/curso/${courseId}`)} className="text-xs font-bold text-purple-600 underline">
          Volver al curso
        </button>
      </div>
    );
  }

  // ─── RENDERIZADO CON SLIDES (paginado) ───
  if (hasSlides) {
    const slide = slides[currentSlide];
    return (
      <div className="p-5 max-w-4xl mx-auto space-y-5 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate(`/curso/${courseId}`)}
          className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al curso
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase tracking-wider">
                Leccion Activa
              </span>
              <h1 className="text-lg font-black text-gray-900 mt-2">{moduleData.titulo}</h1>
            </div>
            {completed && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Completado
              </span>
            )}
          </div>
        </div>

        {/* Slide content */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Media area */}
          {slide.mediaUrl && (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {slide.mediaType === "video" ? (
                <iframe src={slide.mediaUrl} title={slide.title} className="w-full h-full" allowFullScreen />
              ) : slide.mediaType === "pdf" ? (
                <iframe src={`${slide.mediaUrl}#toolbar=0&navpanes=0`} title={slide.title} className="w-full h-full" />
              ) : (
                <img src={slide.mediaUrl} alt={slide.title} className="w-full h-full object-contain" />
              )}
            </div>
          )}

          {/* Slide text content */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-xs font-black text-purple-700">{currentSlide + 1}</span>
              </div>
              <h2 className="text-sm font-black text-gray-900">{slide.title}</h2>
            </div>
            <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {slide.content}
            </div>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="bg-white rounded-2xl border p-4 shadow-sm flex items-center justify-between">
          <button
            onClick={goToPrev}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          {/* Slide indicators */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all rounded-full ${
                  idx === currentSlide
                    ? "w-6 h-2 bg-[#622599]"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Ir a diapositiva ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide counter */}
        <p className="text-center text-[10px] text-gray-400 font-bold">
          Diapositiva {currentSlide + 1} de {totalSlides}
        </p>

        {/* Complete button */}
        <div className="bg-white rounded-2xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-xs font-black text-gray-800">¿Finalizaste este tema?</h3>
            <p className="text-[10px] text-gray-400">Registra tu progreso para desbloquear el siguiente modulo.</p>
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
            {completed ? <><CheckCircle2 className="w-4 h-4" /> Tema Completado</>
              : <>{submitting ? "Guardando..." : "Marcar como Completado"} <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDERIZADO LEGACY (sin slides, scroll normal) ───
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
              Leccion Activa
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
            <iframe src={moduleData.video_url} title={moduleData.titulo} className="w-full h-full" allowFullScreen />
          </div>
        )}

        <div className="prose prose-purple max-w-none text-xs text-gray-600 leading-relaxed space-y-3 pt-2">
          {moduleData.contenido ? (
            <p className="whitespace-pre-line">{moduleData.contenido}</p>
          ) : (
            <p className="italic text-gray-400">
              Este modulo no contiene texto descriptivo. Revisa el material adjunto o el video interactivo.
            </p>
          )}
        </div>

        {moduleData.archivo_url && (
          <div className="border rounded-xl p-4 flex items-center justify-between bg-purple-50/50">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-gray-800">Material Adjunto (PDF/Documento)</p>
                <p className="text-[10px] text-gray-400">Descarga la guia de apoyo de este modulo.</p>
              </div>
            </div>
            <a href={moduleData.archivo_url} target="_blank" rel="noreferrer"
               className="text-xs font-bold text-purple-600 hover:underline">
              Descargar
            </a>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-xs font-black text-gray-800">¿Finalizaste este tema?</h3>
          <p className="text-[10px] text-gray-400">Registra tu progreso para desbloquear el siguiente modulo.</p>
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
          {completed ? <><CheckCircle2 className="w-4 h-4" /> Tema Completado</>
            : <>{submitting ? "Guardando..." : "Marcar como Completado"} <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
