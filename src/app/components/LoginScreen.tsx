import { useState, useEffect, type FormEvent } from "react";
import { LogIn, UserPlus, Mail, Lock, User, KeyRound, ArrowLeft, CheckCircle, Compass } from "lucide-react";
import { toast } from "sonner";
import { iniciarSesion, registrar } from "../lib/auth";
import scoutLoginImg from "../../assets/images/scout-login.jpg";

type Mode = "login" | "register" | "forgot" | "reset";

interface LoginScreenProps {
  onLogin: (usuario: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Sin correos de recuperación: el administrador restablece la contraseña desde Usuarios
    if (mode === "forgot") {
      toast.info("Pide a un administrador que restablezca tu contraseña desde el panel de Usuarios.");
      setMode("login");
      return;
    }

    if (!email || !password) return toast.warning("Por favor completa los campos.");
    if (mode === "register" && !name.trim()) return toast.warning("Por favor introduce tu nombre.");
    if (mode === "register" && password.length < 6) return toast.warning("La contraseña debe tener al menos 6 caracteres.");

    setLoading(true);
    try {
      const usuario = mode === "register"
        ? await registrar(name, email, password)
        : await iniciarSesion(email, password);
      if (mode === "register") toast.success("¡Cuenta Scout creada! Bienvenido.");
      onLogin(usuario);
    } catch (err: any) {
      toast.error(err.message || "No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-purple-200" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ─── PANEL IZQUIERDO: IMAGEN (solo desktop) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* IMAGEN: Foto de scouts en naturaleza */}
        <img
          src={scoutLoginImg}
          alt="Scouts en naturaleza"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay púrpura */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(98,37,153,0.85), rgba(74,28,117,0.9))" }} />
        {/* Contenido superpuesto */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo superior */}
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-asove.svg"
              alt=""
              className="h-16 w-auto object-contain"
            />
            <span className="text-white font-black text-lg tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
              Asociación de Scout de Venezuela
            </span>
          </div>

          {/* Tagline central */}
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
              Tu camino Scout<br />comienza aqui
            </h2>
            <p className="text-purple-200 text-sm leading-relaxed max-w-md">
              Accede a cursos de liderazgo, supervivencia y valores. Completa modulos, gana insignias y alcanza tu siguiente rango.
            </p>
          </div>

          {/* Footer: logo World Scouting */}
          <img
            src="/images/world-scouting.svg"
            alt="World Scouting"
            className="h-12 w-auto object-contain opacity-90"
          />
        </div>
      </div>

      {/* ─── PANEL DERECHO: FORMULARIO ─── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12"
           style={{ background: "linear-gradient(135deg, #f8f5ff, #f0eaff, #f8f5ff)" }}>
        <div className="w-full max-w-md space-y-8">
          {/* Logo movil (solo visible en mobile) */}
          <div className="lg:hidden flex flex-col items-center space-y-2">
            <img
              src="/images/logo-asove.svg"
              alt=""
              className="h-16 w-auto object-contain"
            />
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">Asociación Scout de Venezuela</p>
          </div>

          {/* Tarjeta del formulario */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(98,37,153,0.08)] border border-purple-100/50">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
                {mode === "register" ? "Crear Cuenta Scout"
                  : mode === "forgot" ? "Recuperar Contrasena"
                  : mode === "reset" ? "Nueva Contrasena"
                  : "Bienvenido de vuelta"}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {mode === "register" ? "Unete a la hermandad scout y empieza tu progresion"
                  : mode === "forgot" ? "Un administrador puede restablecer tu contrasena"
                  : mode === "reset" ? "Confirma tu nueva contrasena para acceder"
                  : "Ingresa tus credenciales para acceder a tus insignias"}
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nombre Completo</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5" />
                    <input required type="text" placeholder="Ej: Baden Powell" value={name} onChange={e => setName(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all bg-[#f8f5ff]"
                           style={{ borderColor: name ? "#622599" : "#e8eaf2" }} />
                  </div>
                </div>
              )}

              {mode !== "reset" && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Correo Electronico</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5" />
                    <input required type="email" placeholder="scout@correo.com" value={email} onChange={e => setEmail(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all bg-[#f8f5ff]"
                           style={{ borderColor: email ? "#622599" : "#e8eaf2" }} />
                  </div>
                </div>
              )}

              {mode !== "forgot" && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {mode === "reset" ? "Nueva Contrasena" : "Contrasena"}
                    </label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-[10px] font-bold text-purple-600 hover:underline">
                        Olvidaste tu contrasena?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                    <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all bg-[#f8f5ff]"
                           style={{ borderColor: password ? "#622599" : "#e8eaf2" }} />
                  </div>
                </div>
              )}

              {mode === "reset" && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Confirmar Contrasena</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                    <input required type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all bg-[#f8f5ff]"
                           style={{ borderColor: confirmPassword ? "#622599" : "#e8eaf2" }} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                      className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-purple-200"
                      style={{ background: "linear-gradient(135deg, #622599, #4a1c75)" }}>
                {loading ? (
                  <span className="animate-pulse">PROCESANDO...</span>
                ) : mode === "reset" ? <><CheckCircle className="w-4 h-4" /> ACTUALIZAR</>
                : mode === "forgot" ? <><KeyRound className="w-4 h-4" /> SOLICITAR AYUDA</>
                : mode === "register" ? <><UserPlus className="w-4 h-4" /> REGISTRARME</>
                : <><LogIn className="w-4 h-4" /> INICIAR SESION</>}
              </button>
            </form>

            {/* Switcher */}
            <div className="mt-5 text-center">
              {mode === "forgot" || mode === "reset" ? (
                <button onClick={() => setMode("login")} className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesion
                </button>
              ) : (
                <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-xs font-bold text-purple-600 hover:underline">
                  {mode === "register" ? "Ya tienes cuenta? Inicia sesion" : "No tienes cuenta? Registrate aqui"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
