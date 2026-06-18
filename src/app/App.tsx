import { useState, useEffect } from "react";
import {
  Home, BookOpen, BarChart2, Award, Users, Bell, User, LogIn,
  ChevronRight, TrendingUp, UserPlus, CheckCircle, Star, Lock,
  Search, Menu, ArrowRight, Compass, Leaf, Heart,
  Download, MessageCircle, Play, FileText, X, Clock,
  Trophy, Check, ChevronDown, ChevronUp, AlertCircle, Eye,
  Settings, Trash2, PlusCircle, Edit3, Image as ImageIcon,
  Video, HelpCircle, RefreshCw,
} from "lucide-react";

// ─── CONEXIÓN CON SUPABASE Y COMPONENTES DE ADMINISTRACIÓN ───────────────────
import { supabase } from "./lib/supabase";
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import { AdminDashboard } from "./components/AdminDashboard";
import { UsersScreen } from "./components/UsersScreen";
import { AdminCursosScreen } from "./components/AdminCursosScreen";

// ─── TYPES (Mantenidos para preservar la estructura si usas extensiones TSX) ─
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
  type: "text" | "image" | "video";
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

// ─── COMPONENTES AUXILIARES DEL ESTUDIANTE (CONSERVAN TU DISEÑO EXACTO) ───────
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
        <MetricCard icon={<Award className="w-5 h-5" />} value="12" label="Insignias" color="#7c3aed" bg="#f3f0ff" />
        <MetricCard icon={<BookOpen className="w-5 h-5" />} value={courses.length.toString()} label="Cursos Totales" color="#0ea5e9" bg="#e0f2fe" />
        <MetricCard icon={<Clock className="w-5 h-5" />} value="4.5h" label="Horas Aula" color="#16a34a" bg="#dcfce7" />
        <MetricCard icon={<Trophy className="w-5 h-5" />} value="850" label="Puntos Progresión" color="#ea580c" bg="#ffedd5" />
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
  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

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

function CourseDetailScreen({ course, onSelectModule, onBack }: { course: Course; onSelectModule: (m: ModuleData) => void; onBack: () => void }) {
  const [showCertificate, setShowCertificate] = useState(false);

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
              {course.modules?.map((mod, idx) => (
                <div key={mod.id} onClick={() => onSelectModule(mod)} className="bg-white rounded-xl border p-4 flex items-center justify-between cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all group" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-mono text-xs font-black">{idx + 1}</div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{mod.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mod.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mod.completed ? (
                      <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Check className="w-3 h-3 stroke-[3]" /></span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-600 flex items-center gap-0.5 group-hover:underline">Estudiar <ArrowRight className="w-3 h-3" /></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border p-4 text-center space-y-4" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm"><Trophy className="w-8 h-8" /></div>
            <div>
              <h4 className="text-xs font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Certificación de Especialidad</h4>
              <p className="text-[10px] text-gray-400 mt-1 px-2">Completa el 100% de las lecturas y aprueba los cuestionarios para liberar tu insignia virtual.</p>
            </div>
            <button onClick={() => setShowCertificate(true)} className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:opacity-90" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>Reclamar Insignia</button>
          </div>
        </div>
      </div>

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
              <button onClick={() => alert("Descargando credencial en formato PDF...")} className="flex-1 py-3 text-white font-bold rounded-xl text-xs transition-all hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}><Download className="w-4 h-4" /> Guardar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleViewer({ module, onBack }: { module: ModuleData; onBack: () => void }) {
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    if (currentQuestionIndex + 1 < module.quiz.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizActive(false);
      alert(`¡Cuestionario terminado! Puntuación final guardada.`);
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
                {block.type === "video" && (
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner my-4">
                    <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${block.content}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                  </div>
                )}
              </div>
            ))}
          </div>
          {module.quiz && module.quiz.length > 0 && (
            <button onClick={() => { setQuizActive(true); setCurrentQuestionIndex(0); }} className="w-full py-3 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-90 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}><FileText className="w-4 h-4" /> Rendir Prueba de Validación</button>
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
              {!quizSubmitted ? (
                <button disabled={selectedOption === null} onClick={() => setQuizSubmitted(true)} className="w-full py-2.5 text-white bg-gray-800 font-bold text-xs rounded-xl transition-all disabled:opacity-40">Validar Respuesta</button>
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

// ─── COMPONENTE PRINCIPAL DE APLICACIÓN LOGUEADA ─────────────────────────────
function MainApp({ userProfile, onLogout }: { userProfile: any; onLogout: () => void }) {
  const [screen, setScreen] = useState<Screen>(userProfile.role === "admin" ? "dashboard" : "dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);

  // Sincroniza dinámicamente los cursos y módulos desde Supabase
  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase.from("cursos").select("*, modulos(*)");
      if (!error && data) {
        const formatted: Course[] = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          rating: Number(c.rating) || 5.0,
          reviews: c.reviews || 0,
          badge: c.badge,
          badgeColor: c.badge_color || "bg-violet-100 text-violet-700",
          description: c.description,
          duration: c.duration,
          img: c.img,
          modules: (c.modulos || []).sort((a: any, b: any) => a.orden - b.orden).map((m: any) => ({
            id: m.id,
            title: m.title,
            duration: m.duration,
            content: typeof m.content === "string" ? JSON.parse(m.content) : m.content,
            quiz: typeof m.quiz === "string" ? JSON.parse(m.quiz) : m.quiz,
            completed: false
          }))
        }));
        setCourses(formatted);
      }
    }
    loadData();
  }, [screen]); // Se refresca de manera inteligente al cambiar de pantallas para ver cambios del CRUD

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setScreen("course-detail");
  };

  const handleSelectModule = (mod: ModuleData) => {
    setSelectedModule(mod);
    setScreen("module-viewer");
  };

  return (
    <div className="min-h-screen bg-[#faf9fe] flex flex-col lg:flex-row pb-16 lg:pb-0 selection:bg-purple-200">
     <Sidebar 
  role={userProfile.role as Role} 
  currentScreen={screen} 
  onNavigate={(s: Screen) => { setScreen(s); setSelectedCourse(null); setSelectedModule(null); }} 
  onLogout={onLogout} 
/>

      <main className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto w-full lg:p-4">
        {/* Barra superior de identidad visual */}
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

        {/* Enrutador de vistas condicionales */}
        <div className="flex-1 pb-10">
          {screen === "dashboard" && userProfile.role === "user" && <UserDashboard userProfile={userProfile} courses={courses} onSelectCourse={handleSelectCourse} onNavigate={setScreen} />}
          {screen === "dashboard" && userProfile.role === "admin" && <AdminDashboard />}
          {screen === "catalogo" && <CatalogoScreen courses={courses} onSelectCourse={handleSelectCourse} />}
          {screen === "course-detail" && selectedCourse && <CourseDetailScreen course={selectedCourse} onSelectModule={handleSelectModule} onBack={() => setScreen("catalogo")} />}
          {screen === "module-viewer" && selectedModule && <ModuleViewer module={selectedModule} onBack={() => setScreen("course-detail")} />}
          {screen === "users" && userProfile.role === "admin" && <UsersScreen />}
          {screen === "admin-cursos" && userProfile.role === "admin" && <AdminCursosScreen />}
        </div>
      </main>
    </div>
  );
}

// ─── ROOT COMPONENT (GESTIONA LA SESIÓN CRUCIAL CON SUPABASE) ─────────────────
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar si existe una sesión activa al arrancar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Suscribirse a cambios en la autenticación (Login, Registro, Logout)
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
      // Fallback de seguridad si el perfil tarda un instante en sincronizarse tras el registro
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

  // Si no hay sesión, se renderiza la pantalla de Login conectada a Supabase
  if (!session || !profile) {
    return <LoginScreen onLogin={() => {}} />;
  }

  // Si pasa la validación, ingresa al Aula Virtual con su rol e identidad correspondiente
  return <MainApp userProfile={profile} onLogout={() => supabase.auth.signOut()} />;
}