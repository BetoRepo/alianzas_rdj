import { useState, useEffect, useMemo, type FormEvent } from "react";
import {
  Home, BookOpen, BarChart2, Award, Users, Bell, User, LogIn,
  ChevronRight, TrendingUp, UserPlus, CheckCircle, Star, Lock,
  Search, Menu, ArrowRight, Compass, Leaf, Heart,
  Download, MessageCircle, Play, FileText, X, Clock,
  Trophy, Check, ChevronDown, ChevronUp, AlertCircle, Eye,
  Settings, Trash2, PlusCircle, Edit3, Image as ImageIcon,
  Video, HelpCircle, RefreshCw,
} from "lucide-react";

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./components/ui/carousel";
import { getFileUrl } from "./lib/supabase";

function AsyncIframe({ srcValue }: { srcValue: string }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resolved = await getFileUrl(srcValue, 3600);
        if (!mounted) return;
        setUrl(resolved || srcValue);
      } catch (e) {
        if (mounted) setUrl(srcValue);
      }
    })();
    return () => { mounted = false; };
  }, [srcValue]);

  if (!url) return <div className="h-96 flex items-center justify-center text-xs text-gray-400">Generando vista...</div>;

  return <iframe className="w-full h-96" src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} frameBorder="0"></iframe>;
}

// ─── CONEXIÓN CON SUPABASE Y COMPONENTES DE ADMINISTRACIÓN ───────────────────
import { supabase } from "./lib/supabase";
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import { AdminDashboard } from "./components/AdminDashboard";
import { UsersScreen } from "./components/UsersScreen";
import { AdminCursosScreen } from "./components/AdminCursosScreen";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Role = "admin" | "user";
type Screen =
  | "login" | "dashboard" | "catalogo" | "perfil"
  | "mis-cursos" | "course-detail" | "module-viewer"
  | "users" | "admin-cursos";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ContentBlock {
  type: "text" | "image" | "video" | "slides" | "pdf";
  content: string;
  caption?: string;
}

interface ModuleData {
  id: number;
  title: string;
  duration: string;
  content: ContentBlock[];
  quiz: QuizQuestion[];
  completed: boolean;
}

interface Course {
  id: number;
  title: string;
  category: string;
  rating: number;
  reviews: number;
  badge: string | null;
  badgeColor: string;
  description: string;
  duration: string;
  img: string;
  modules: ModuleData[];
}

function parseContentBlocks(value: unknown): ContentBlock[] {
  if (Array.isArray(value)) {
    return value.map((block: any) => ({
      type: block?.type === "image" || block?.type === "video" || block?.type === "slides" || block?.type === "pdf" ? block.type : "text",
      content: typeof block?.content === "string" ? block.content : "",
      caption: typeof block?.caption === "string" ? block.caption : ""
    })).filter((block) => block.content.trim() || block.caption?.trim());
  }
  return [];
}

function parseDurationMinutes(duration: string) {
  const normalized = duration.toLowerCase();
  if (normalized.includes("hora") || normalized.includes("hr") || normalized.includes("h")) {
    const number = Number(normalized.replace(/[^0-9.]/g, ""));
    return Number.isFinite(number) ? Math.round(number * 60) : 60;
  }
  const minutes = Number(normalized.replace(/[^0-9.]/g, ""));
  return Number.isFinite(minutes) ? minutes : 0;
}

function getVideoEmbedUrl(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.hostname.includes("youtube.com")) {
        const videoId = url.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
      }
      if (url.hostname.includes("youtu.be")) {
        const [, videoId] = url.pathname.split("/");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }
  return `https://www.youtube.com/embed/${trimmed}`;
}

function downloadCertificateImage(profile: any, course: Course) {
  const width = 1600;
  const height = 1100;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const name = String(profile?.name || "Scout").toUpperCase();
  const courseTitle = String(course.title || "Insignia Scout").toUpperCase();
  const issueDate = new Date().toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric" });

  ctx.fillStyle = "#5b21b6";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(80, 80, width - 160, height - 160);
  ctx.fillStyle = "#5b21b6";
  ctx.fillRect(140, 140, width - 280, 12);

  ctx.fillStyle = "#111827";
  ctx.textAlign = "left";
  ctx.font = "bold 54px 'Nunito', sans-serif";
  ctx.fillText("FORMACIÓN DEL JOVEN Y ADULTO SCOUT", 180, 260);

  ctx.font = "700 34px 'Inter', sans-serif";
  ctx.fillText("La Asociación de Scouts de Venezuela", 180, 330);

  ctx.font = "600 26px 'Inter', sans-serif";
  ctx.fillText("Certifica que", 180, 400);

  ctx.font = "bold 64px 'Nunito', sans-serif";
  ctx.fillText(name, 180, 490);

  ctx.font = "600 26px 'Inter', sans-serif";
  ctx.fillText("Ha aprobado el curso de", 180, 560);

  ctx.font = "bold 58px 'Nunito', sans-serif";
  ctx.fillText(courseTitle, 180, 650);

  ctx.font = "500 24px 'Inter', sans-serif";
  ctx.fillStyle = "#4b5563";
  ctx.fillText(`Emitido el ${issueDate}`, 180, 730);

  ctx.strokeStyle = "rgba(91, 33, 182, 0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(180, 880);
  ctx.lineTo(620, 880);
  ctx.moveTo(width - 620, 880);
  ctx.lineTo(width - 180, 880);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = "600 24px 'Inter', sans-serif";
  ctx.fillText("Fulanito", 180, 920);
  ctx.fillText("Fulanito", width - 620, 920);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${course.title.replace(/\s+/g, "_")}_${name.replace(/\s+/g, "_")}.png`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── COMPONENTES AUXILIARES DEL ESTUDIANTE ────────────────────────────────────
function MetricCard({ icon, value, label, color, bg }: { icon: React.ReactNode; value: string; label: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border flex items-center gap-4 hover:shadow-md transition-all duration-300" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg, color: color }}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-black text-gray-900" style={{ fontFamily: "JetBrains Mono, sans-serif" }}>{value}</div>
        <div className="text-xs font-semibold text-gray-400 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>{label}</div>
      </div>
    </div>
  );
}

function UserDashboard({ userProfile, courses, onSelectCourse, onNavigate }: { userProfile: any; courses: Course[]; onSelectCourse: (c: Course) => void; onNavigate: (s: Screen) => void }) {
  const activeCourses = courses.slice(0, 2);
  const totalModules = courses.reduce((sum, course) => sum + (course.modules?.length || 0), 0);
  const completedModules = courses.reduce((sum, course) => sum + (course.modules?.filter((module) => module.completed).length || 0), 0);
  const totalMinutes = courses.reduce((sum, course) => sum + course.modules.reduce((moduleSum, module) => moduleSum + parseDurationMinutes(module.duration), 0), 0);
  const progressValue = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const hoursLabel = totalMinutes > 0 ? `${(totalMinutes / 60).toFixed(1)}h` : "0h";

  return (
    <div className="p-5 space-y-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-gradient-to-br from-[#1d1048] to-[#3b1d82] rounded-[28px] p-6 text-white relative overflow-hidden shadow-lg border border-purple-500/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2 max-w-md">
          <span className="text-[10px] uppercase tracking-widest font-black text-purple-300 bg-purple-900/50 px-2.5 py-1 rounded-full border border-purple-500/20">Siempre Listos</span>
          <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>¡Buena caza, {userProfile.name}!</h2>
          <p className="text-xs text-purple-200/80 leading-relaxed font-medium">Continúa con tu progresión scout. Tienes desafíos pendientes para obtener tus insignias de especialidad.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard icon={<Award className="w-5 h-5" />} value={courses.length.toString()} label="Insignias Disponibles" color="#7c3aed" bg="#f3f0ff" />
        <MetricCard icon={<BookOpen className="w-5 h-5" />} value={totalModules.toString()} label="Módulos Activos" color="#0ea5e9" bg="#e0f2fe" />
        <MetricCard icon={<Clock className="w-5 h-5" />} value={hoursLabel} label="Horas Aula" color="#16a34a" bg="#dcfce7" />
        <MetricCard icon={<Trophy className="w-5 h-5" />} value={`${progressValue}%`} label="Progreso Real" color="#ea580c" bg="#ffedd5" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-lg tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>Tus Cursos Activos</h3>
          <button onClick={() => onNavigate("catalogo")} className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:underline">Ver catálogo <ArrowRight className="w-3 h-3" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCourses.map((c) => (
            <div key={c.id} onClick={() => onSelectCourse(c)} className="bg-white rounded-2xl border p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all duration-300 group" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.badgeColor}`}>{c.category}</span>
                  </div>
                  <h4 className="font-black text-gray-800 text-sm truncate group-hover:text-purple-700 transition-colors" style={{ fontFamily: "Nunito, sans-serif" }}>{c.title}</h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                    <span>Progreso</span>
                    <span className="font-mono text-purple-600">40%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: "40%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-xs text-gray-400 col-span-2 text-center py-6">No tienes cursos asignados en este momento.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogoScreen({ courses, onSelectCourse }: { courses: Course[]; onSelectCourse: (c: Course) => void }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => courses.filter((course) => {
    const term = search.toLowerCase();
    return course.title.toLowerCase().includes(term) || course.category.toLowerCase().includes(term) || course.description.toLowerCase().includes(term);
  }), [courses, search]);

  return (
    <div className="p-5 space-y-5 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <div>
        <p className="text-xs font-bold text-purple-500 uppercase tracking-wider">Formación virtual</p>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>Catálogo de Competencias Scout</h2>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border shadow-sm transition-all focus-within:border-purple-400" style={{ borderColor: "rgba(91,33,182,0.1)" }}>
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input type="text" placeholder="Buscar especialidades, nudos, campismo..." value={search} onChange={e => setSearch(e.target.value)} className="w-full text-xs bg-transparent outline-none placeholder-gray-400 text-gray-700 font-medium" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} onClick={() => onSelectCourse(c)} className="bg-white rounded-2xl border overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 group flex flex-col justify-between" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
            <div>
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3">
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full shadow-sm ${c.badgeColor}`}>{c.category}</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <span className="flex items-center gap-0.5 text-amber-500"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {c.rating}</span>
                  <span>•</span>
                  <span>{c.duration}</span>
                </div>
                <h3 className="font-black text-gray-800 text-base leading-snug group-hover:text-purple-700 transition-colors" style={{ fontFamily: "Nunito, sans-serif" }}>{c.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{c.description}</p>
              </div>
            </div>
            <div className="p-4 pt-0 border-t border-gray-50 mt-2 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Iniciar Insignia</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseDetailScreen({ course, userProfile, onSelectModule, onBack }: { course: Course; userProfile: any; onSelectModule: (m: ModuleData) => void; onBack: () => void }) {
  const [showCertificate, setShowCertificate] = useState(false);

  // Validar si TODOS los módulos están completados
  const allCompleted = course.modules.length > 0 && course.modules.every((mod) => mod.completed);

  return (
    <div className="p-5 space-y-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">&larr; Volver al catálogo</button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-5">
          <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${course.badgeColor}`}>{course.category}</span>
              <span className="text-xs font-bold text-gray-400">{course.duration} de contenido</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{course.title}</h2>
            <p className="text-xs text-gray-500 leading-relaxed">{course.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-gray-900 text-base tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>Módulos del Plan de Adelanto</h3>
            <div className="space-y-2.5">
              {course.modules?.map((mod, idx) => {
                const isUnlocked = idx === 0 || course.modules[idx - 1].completed;

                return (
                  <div 
                    key={mod.id} 
                    onClick={() => {
                      if (isUnlocked) {
                        onSelectModule(mod);
                      } else {
                        alert("Debes aprobar y completar el módulo anterior para acceder a este.");
                      }
                    }} 
                    className={`rounded-xl border p-4 flex items-center justify-between transition-all group ${
                      !isUnlocked
                        ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                        : mod.completed 
                        ? "bg-emerald-50 border-emerald-200 cursor-pointer" 
                        : "bg-white border-purple-100 hover:border-purple-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black ${
                        !isUnlocked 
                          ? "bg-gray-200 text-gray-500" 
                          : mod.completed 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-purple-50 text-purple-600"
                      }`}>
                        {!isUnlocked ? <Lock className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">{mod.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{mod.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isUnlocked && (
                        <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                          Bloqueado
                        </span>
                      )}
                      {isUnlocked && mod.completed && (
                        <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      {isUnlocked && !mod.completed && (
                        <span className="text-[10px] font-bold text-purple-600 flex items-center gap-0.5 group-hover:underline">
                          Estudiar <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tarjeta de Certificación de Especialidad */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border p-4 text-center space-y-4" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Certificación de Especialidad</h4>
              <p className="text-[10px] text-gray-400 mt-1 px-2">Completa el 100% de las lecturas y aprueba los cuestionarios para liberar tu insignia virtual.</p>
            </div>

            <button 
              disabled={!allCompleted}
              onClick={() => setShowCertificate(true)} 
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                allCompleted 
                  ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70"
              }`}
            >
              {allCompleted ? "Reclamar Insignia" : "Insignia Bloqueada"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Certificado */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 shadow-2xl relative border border-purple-100 text-center space-y-5 animate-scale-in">
            <button onClick={() => setShowCertificate(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto"><Award className="w-10 h-10 animate-bounce" /></div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>¡Felicidades, Hermano Scout!</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Has demostrado las competencias necesarias y tu constancia en el plan de adelanto para portar este reconocimiento.</p>
            </div>
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-dashed border-purple-200 text-left">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Insignia Autorizada</div>
              <div className="text-sm font-black text-gray-800 mt-0.5" style={{ fontFamily: "Nunito, sans-serif" }}>{course.title}</div>
              <div className="text-xs text-gray-400 mt-2">Emitido de forma digital para tu registro de progresión institucional.</div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCertificate(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors">Cerrar</button>
              <button onClick={() => downloadCertificateImage(userProfile, course)} className="flex-1 py-3 text-white font-bold rounded-xl text-xs transition-all hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}><Download className="w-4 h-4" /> Descargar certificado</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleViewer({ module, course, onBack, onComplete }: { module: ModuleData; course: Course; onBack: () => void; onComplete: (moduleId: number) => void }) {
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lastAnswerWasCorrect, setLastAnswerWasCorrect] = useState(false);

  const isLastQuestion = currentQuestionIndex === (module.quiz?.length || 0) - 1;

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    if (currentQuestionIndex + 1 < module.quiz.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizActive(false);
      setCurrentQuestionIndex(0);
      setLastAnswerWasCorrect(false);
      alert("¡Cuestionario terminado! Buen trabajo.");
    }
  };

  return (
    <div className="p-5 space-y-5 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">&larr; Volver al plan de estudios</button>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
        <h2 className="text-xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{module.title}</h2>
      </div>

      {!quizActive ? (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
            {module.content?.map((block, i) => (
              <div key={i} className="space-y-2">
                {block.type === "text" && <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>}
                {block.type === "image" && block.content && (
                  <div className="my-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img src={block.content} alt={block.caption || module.title} className="w-full max-h-[480px] object-contain" />
                    {block.caption && <p className="px-3 py-2 text-[11px] text-gray-500">{block.caption}</p>}
                  </div>
                )}
                {block.type === "video" && block.content && (
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner my-4">
                    {/^https?:\/\//i.test(block.content) && (block.content.includes("youtube.com") || block.content.includes("youtu.be")) ? (
                      <iframe className="w-full h-full" src={getVideoEmbedUrl(block.content)} title="Video del módulo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    ) : (
                      <video controls className="w-full h-full bg-black">
                        <source src={block.content} />
                        Tu navegador no soporta este formato de video.
                      </video>
                    )}
                  </div>
                )}
                {block.type === "slides" && block.content && (
                  <div className="my-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3">
                    {block.content.trim().startsWith("[") ? (
                      (() => {
                        try {
                          const imgs = JSON.parse(block.content);
                          if (Array.isArray(imgs) && imgs.length > 0) {
                            return (
                              <div>
                                <Carousel>
                                  <CarouselContent className="flex">
                                    {imgs.map((src: string, idx: number) => (
                                      <CarouselItem key={idx} className="p-2">
                                        <div className="rounded-xl overflow-hidden bg-white">
                                          <img src={src} alt={`Slide ${idx + 1}`} className="w-full h-64 object-contain" />
                                        </div>
                                      </CarouselItem>
                                    ))}
                                  </CarouselContent>
                                  <CarouselPrevious />
                                  <CarouselNext />
                                </Carousel>
                                {block.caption && <p className="px-3 py-2 text-[11px] text-gray-500">{block.caption}</p>}
                              </div>
                            );
                          }
                        } catch (e) {
                          // Fallback to office viewer
                        }
                        return (
                          <div className="aspect-video rounded-xl overflow-hidden">
                            <iframe className="w-full h-96" src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(block.content)}`} frameBorder="0"></iframe>
                          </div>
                        );
                      })()
                    ) : (
                      <div>
                        <div className="aspect-video rounded-xl overflow-hidden">
                          <AsyncIframe srcValue={block.content} />
                        </div>
                        {block.caption && <p className="px-3 py-2 text-[11px] text-gray-500">{block.caption}</p>}
                        <div className="text-xs text-gray-500 mt-2">Si el visor no carga, <a href={block.content} target="_blank" rel="noreferrer" className="text-purple-600 underline">abrir en nueva pestaña</a>.</div>
                      </div>
                    )}
                  </div>
                )}

                {block.type === "pdf" && block.content && (
                  <div className="my-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">PDF</div>
                        <span>{block.caption || "Documento PDF"}</span>
                      </div>
                      <a href={block.content} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-purple-600 hover:text-purple-800 underline">Abrir en otra pestaña</a>
                    </div>
                    <div className="overflow-hidden rounded-xl bg-white border border-gray-200">
                      <embed src={block.content} type="application/pdf" className="w-full h-[620px] block" title={block.caption || "Vista previa del PDF"} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {module.quiz && module.quiz.length > 0 ? (
            <button onClick={() => { setQuizActive(true); setCurrentQuestionIndex(0); }} className="w-full py-3 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-90 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}><FileText className="w-4 h-4" /> Rendir Prueba de Validación</button>
          ) : (
            <button onClick={() => onComplete(module.id)} className="w-full py-3 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-90 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700">Aprobar y Completar Módulo</button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-5 max-w-xl mx-auto space-y-5" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Evaluación Técnica</span>
            <span>Pregunta {currentQuestionIndex + 1} de {module.quiz.length}</span>
          </div>
          {module.quiz[currentQuestionIndex] && (
            <>
              <h3 className="font-black text-gray-800 text-sm leading-snug" style={{ fontFamily: "Nunito, sans-serif" }}>{module.quiz[currentQuestionIndex].question}</h3>
              <div className="space-y-2">
                {module.quiz[currentQuestionIndex].options.map((opt, oIdx) => {
                  let optStyle = "border-gray-200 hover:border-purple-300 bg-gray-50/50";
                  if (selectedOption === oIdx) optStyle = "border-purple-600 bg-purple-50 text-purple-700 font-bold";
                  if (quizSubmitted) {
                    if (oIdx === module.quiz[currentQuestionIndex].correct) optStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold";
                    else if (selectedOption === oIdx) optStyle = "border-red-400 bg-red-50 text-red-700";
                  }
                  return (
                    <button key={oIdx} disabled={quizSubmitted} onClick={() => setSelectedOption(oIdx)} className={`w-full text-left p-3 border-2 rounded-xl text-xs transition-all ${optStyle}`}>{opt}</button>
                  );
                })}
              </div>
              {quizSubmitted && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
                  <strong>Explicación Scout:</strong> {module.quiz[currentQuestionIndex].explanation}
                </div>
              )}
              {quizSubmitted && lastAnswerWasCorrect && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-bold">¡Muy bien, lo hiciste bien!</p>
                  {isLastQuestion ? (
                    <p className="mt-1">Has completado el módulo y tu progreso se guardó como aprobado.</p>
                  ) : (
                    <p className="mt-1">Continúa con la siguiente pregunta para terminar el módulo.</p>
                  )}
                </div>
              )}
              {quizSubmitted && !lastAnswerWasCorrect && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-bold">Respuesta incorrecta.</p>
                  <p className="mt-1">Revisa la explicación y vuelve a intentarlo en la siguiente pregunta.</p>
                </div>
              )}
              {!quizSubmitted ? (
                <button disabled={selectedOption === null} onClick={() => {
                  if (selectedOption === null) return;
                  const isCorrect = selectedOption === module.quiz[currentQuestionIndex].correct;
                  setQuizSubmitted(true);
                  setLastAnswerWasCorrect(isCorrect);
                  if (isCorrect && isLastQuestion) {
                    onComplete(module.id);
                  }
                }} className="w-full py-2.5 text-white bg-gray-800 font-bold text-xs rounded-xl transition-all disabled:opacity-40">Validar Respuesta</button>
              ) : (
                <button onClick={handleNextQuestion} className="w-full py-2.5 text-white font-bold text-xs rounded-xl transition-all" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>Siguiente Pregunta</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ profile, onSave, onCancel }: { profile: any; onSave: (profile: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(profile?.name || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name || "");
    setAvatar(profile?.avatar || "");
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    const nextAvatar = (avatar || name || "S").trim().slice(0, 2).toUpperCase();
    const { data, error } = await supabase
      .from("perfiles")
      .update({
        name: name.trim(),
        avatar: nextAvatar,
      })
      .eq("id", profile.id)
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    onSave({ ...profile, ...data, name: data?.name || name.trim(), avatar: data?.avatar || nextAvatar });
  }

  return (
    <div className="p-5 space-y-5 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
        <div>
          <p className="text-xs font-bold text-purple-500 uppercase tracking-wider">Tu identidad scout</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>Editar perfil</h2>
          <p className="text-xs text-gray-500 mt-1">Actualiza tu nombre y la inicial que aparece en la plataforma.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Avatar / Inicial</label>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm"
              placeholder="Ej: JS"
              maxLength={2}
            />
          </div>
          <div className="rounded-xl bg-purple-50/70 border border-purple-100 p-3 text-[11px] text-purple-700">
            <strong>Nota:</strong> solo puedes editar tu información personal. El rol y la pertenencia del equipo se mantienen administrados.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL DE APLICACIÓN LOGUEADA ─────────────────────────────
function MainApp({ userProfile, onLogout, onProfileUpdated }: { userProfile: any; onLogout: () => void; onProfileUpdated: (profile: any) => void }) {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase.from("cursos").select("*, modulos(*)");
      if (!error && data) {
        const formatted: Course[] = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          rating: Number(c.rating) || 0,
          reviews: Number(c.reviews) || 0,
          badge: c.badge,
          badgeColor: c.badge_color || "bg-violet-100 text-violet-700",
          description: c.description,
          duration: c.duration,
          img: c.img,
          modules: (c.modulos || []).sort((a: any, b: any) => a.orden - b.orden).map((m: any) => ({
            id: m.id,
            title: m.title,
            duration: m.duration,
            content: parseContentBlocks(typeof m.content === "string" ? JSON.parse(m.content) : m.content),
            quiz: typeof m.quiz === "string" ? JSON.parse(m.quiz) : (m.quiz || []),
            completed: false
          }))
        }));
        setCourses(formatted);
      }
    }
    void loadData();
  }, [screen]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setScreen("course-detail");
  };

  const handleSelectModule = (mod: ModuleData) => {
    setSelectedModule(mod);
    setScreen("module-viewer");
  };

  const handleCompleteModule = (moduleId: number) => {
    setCourses((prev) => prev.map((course) => {
      if (course.id !== selectedCourse?.id) return course;
      return {
        ...course,
        modules: course.modules.map((mod) => mod.id === moduleId ? { ...mod, completed: true } : mod)
      };
    }));

    if (selectedCourse) {
      setSelectedCourse({
        ...selectedCourse,
        modules: selectedCourse.modules.map((mod) => mod.id === moduleId ? { ...mod, completed: true } : mod)
      });
    }

    if (selectedModule?.id === moduleId) {
      setSelectedModule({ ...selectedModule, completed: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9fe] flex flex-col lg:flex-row pb-16 lg:pb-0 selection:bg-purple-200">
      <Sidebar
        role={userProfile.role as Role}
        currentScreen={screen}
        onNavigate={(s: any) => {
          setScreen(s as Screen);
          setSelectedCourse(null);
          setSelectedModule(null);
        }}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto w-full lg:p-4">
        <header className="bg-white border-b lg:border-none lg:rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30 lg:mt-2" style={{ borderColor: "rgba(91,33,182,0.05)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>{userProfile.avatar}</div>
            <div>
              <h2 className="text-xs font-black text-gray-800 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{userProfile.name}</h2>
              <p className="text-[10px] text-purple-600 font-bold mt-0.5">{userProfile.role_label}</p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-xl border flex items-center justify-center text-gray-400 hover:text-gray-600 relative"><Bell className="w-4 h-4" /><span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-600 rounded-full"></span></button>
        </header>

        <div className="flex-1 pb-10">
          {screen === "dashboard" && userProfile.role === "user" && <UserDashboard userProfile={userProfile} courses={courses} onSelectCourse={handleSelectCourse} onNavigate={setScreen} />}
          {screen === "dashboard" && userProfile.role === "admin" && <AdminDashboard />}
          {screen === "catalogo" && <CatalogoScreen courses={courses} onSelectCourse={handleSelectCourse} />}
          {screen === "perfil" && <ProfileScreen profile={userProfile} onSave={(updatedProfile) => { onProfileUpdated(updatedProfile); setScreen("dashboard"); }} onCancel={() => setScreen("dashboard")} />}
          {screen === "course-detail" && selectedCourse && <CourseDetailScreen course={selectedCourse} userProfile={userProfile} onSelectModule={handleSelectModule} onBack={() => setScreen("catalogo")} />}
          {screen === "module-viewer" && selectedModule && selectedCourse && <ModuleViewer module={selectedModule} course={selectedCourse} onBack={() => setScreen("course-detail")} onComplete={handleCompleteModule} />}
          {screen === "users" && userProfile.role === "admin" && <UsersScreen />}
          {screen === "admin-cursos" && userProfile.role === "admin" && <AdminCursosScreen />}
        </div>
      </main>
    </div>
  );
}

// ─── COMPONENTE RAÍZ ──────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase.from("perfiles").select("*").eq("id", userId).single();
    if (!error && data) {
      setProfile(data);
    } else {
      setProfile({ name: "Scout", email: "", role: "user", role_label: "Miembro Activo", avatar: "S" });
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ background: "#11072c" }}>
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold tracking-widest text-purple-300 animate-pulse uppercase">Cargando Aula Virtual Scout...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return <MainApp userProfile={profile} onLogout={() => supabase.auth.signOut()} onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)} />;
}