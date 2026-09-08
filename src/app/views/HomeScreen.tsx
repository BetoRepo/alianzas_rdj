import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Play,
  Pause,
  User,
  BookMarked,
  UserCheck,
} from "lucide-react";

export default function HomeScreen({ userProfile }: { userProfile: any }) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-600 rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <img
          src="/images/scout-banner.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_25%] opacity-30 pointer-events-none"
        />
        <div className="space-y-1.5 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-200 bg-purple-950/40 px-3 py-1 rounded-full border border-purple-400/20">
            Siempre Listos
          </span>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>
            ¡Hola, {userProfile?.name || "Scout"}! 👋
          </h1>
          <p className="text-xs text-purple-100 max-w-md leading-relaxed">
            Bienvenido a la plataforma de formación Scout. Explora tus cursos y alcanza nuevas insignias.
          </p>
        </div>

        <button
          onClick={() => navigate("/catalogo")}
          className="z-10 bg-white text-purple-900 hover:bg-purple-50 px-5 py-3 rounded-2xl text-xs font-black shadow-md flex items-center gap-2 transition-all shrink-0"
        >
          Explorar Cursos <Compass className="w-4 h-4 text-purple-700" />
        </button>
      </div>

      {/* Sección de Video de Bienvenida */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Play className="w-4 h-4 text-purple-600 fill-purple-600" /> Video de Bienvenida
          </h2>
          <p className="text-[10px] text-gray-400 mt-1">Conoce más sobre nuestra plataforma de formación Scout</p>
        </div>
        <div className="relative w-full max-w-2xl mx-auto aspect-video bg-gray-900 mx-5 mb-5 rounded-2xl overflow-hidden group">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src="/videos/bienvenida.mp4"
            muted
            playsInline
            preload="metadata"
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onEnded={() => setIsVideoPlaying(false)}
          >
            Tu navegador no soporta la reproducción de videos.
          </video>

          {/* Overlay de control */}
          <button
            onClick={toggleVideo}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label={isVideoPlaying ? "Pausar video" : "Reproducir video"}
          >
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm hover:bg-white transition-colors">
              {isVideoPlaying ? (
                <Pause className="w-6 h-6 text-purple-900" />
              ) : (
                <Play className="w-6 h-6 text-purple-900 ml-1" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate("/catalogo")}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-purple-700 transition-colors">Catálogo</span>
        </button>

        <button
          onClick={() => navigate("/mis-cursos")}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <BookMarked className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-amber-700 transition-colors">Mis Cursos</span>
        </button>

        <button
          onClick={() => navigate("/perfil")}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <User className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-blue-700 transition-colors">Mi Perfil</span>
        </button>

        <button
          onClick={() => navigate("/perfil")}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <UserCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">Completar Perfil</span>
        </button>
      </div>
    </div>
  );
}
