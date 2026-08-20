import { useState, useEffect, type FormEvent } from "react";
import { LogIn, UserPlus, Mail, Lock, User, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  // Modos posibles: "login" | "register" | "forgot" | "reset"
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Escuchar cuando el usuario entra mediante un enlace de recuperación de contraseña de Supabase
  useEffect(() => {
    // 1. Escuchar evento Auth de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });

    // 2. Fallback: Verificar el hash de la URL si el usuario abre el enlace de correo
    if (window.location.hash.includes("type=recovery")) {
      setMode("reset");
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ─── OPCIÓN 1: SOLICITAR RECUPERACIÓN DE CONTRASEÑA ───
    if (mode === "forgot") {
      if (!email) return toast.warning("Por favor introduce tu correo electrónico.");
      setLoading(true);

      // Se envía el enlace a la raíz de la app para evitar el error 404 en Vercel
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      setLoading(false);

      if (error) {
        toast.error("Error al enviar el correo: " + error.message);
      } else {
        toast.success("¡Enlace enviado! Revisa tu bandeja de entrada o spam para restablecer tu contraseña.");
        setMode("login");
      }
      return;
    }

    // ─── OPCIÓN 2: GUARDAR NUEVA CONTRASEÑA (RESET) ───
    if (mode === "reset") {
      if (!password) return toast.warning("Por favor ingresa una nueva contraseña.");
      if (password !== confirmPassword) return toast.warning("Las contraseñas no coinciden.");
      
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);

      if (error) {
        toast.error("Error al actualizar la contraseña: " + error.message);
      } else {
        toast.success("¡Tu contraseña ha sido actualizada con éxito! Ahora puedes iniciar sesión.");
        setPassword("");
        setConfirmPassword("");
        // Limpiar hash de la URL
        window.history.replaceState(null, "", window.location.pathname);
        setMode("login");
      }
      return;
    }

    // Validación base para Login y Registro
    if (!email || !password) return toast.warning("Por favor completa los campos.");
    setLoading(true);

    if (mode === "register") {
      // ─── OPCIÓN 3: REGISTRO DE NUEVO USUARIO ───
      if (!name) {
        toast.warning("Por favor introduce tu nombre.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (authError) {
        toast.error("Error al registrar: " + authError.message);
      } else if (authData?.user) {
        // Generar iniciales del Avatar
        const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        // Crear el perfil público en la base de datos
        const { error: profileError } = await supabase.from("perfiles").insert([{
          id: authData.user.id,
          name,
          email,
          role: "user",
          role_label: "Scout de Tropa",
          avatar: initials || "ST"
        }]);

        if (profileError) {
          toast.error("Usuario creado en Auth, pero hubo un problema al guardar el perfil: " + profileError.message);
        } else {
          toast.success("¡Cuenta Scout creada con éxito! Ya puedes iniciar sesión.");
          setMode("login");
        }
      }
    } else {
      // ─── OPCIÓN 4: INICIO DE SESIÓN DE USUARIO EXISTENTE ───
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error("Error de credenciales: " + error.message);
      } else if (data?.user) {
        onLogin();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-purple-200"
         style={{ background: "linear-gradient(135deg, #120731, #1c0d45, #0d041e)", fontFamily: "Inter, sans-serif" }}>
      {/* Tarjeta contenedora principal */}
      <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-purple-950/5 relative overflow-hidden">
        {/* Decoraciones de fondo estéticas */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-200/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Encabezado e Isotipo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                    style={{ background: "linear-gradient(135deg, #622599, #4a1c75)" }}>
              <span className="text-white font-black text-xl tracking-tighter" style={{ fontFamily: "Nunito, sans-serif" }}>S</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight text-center" style={{ fontFamily: "Nunito, sans-serif" }}>
              {mode === "register" 
                ? "Crear Cuenta Scout" 
                : mode === "forgot" 
                ? "Recuperar Contraseña" 
                : mode === "reset"
                ? "Nueva Contraseña"
                : "Aula Virtual Scout"}
            </h1>
            <p className="text-xs text-gray-400 mt-1 text-center px-4">
              {mode === "register" 
                ? "Únete a la hermandad scout y empieza tu progresión" 
                : mode === "forgot"
                ? "Ingresa tu correo y te enviaremos un enlace de recuperación"
                : mode === "reset"
                ? "Ingresa y confirma tu nueva contraseña para acceder a tu cuenta"
                : "Ingresa tus credenciales para acceder a tus insignias y cursos"}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo: Nombre (Solo en Registro) */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nombre Completo</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input required type="text" placeholder="Ej: Baden Powell" value={name} onChange={e => setName(e.target.value)}
                         className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                          style={{ borderColor: name ? "#622599" : "#e8eaf2", background: "#f8f5ff" }} />
                </div>
              </div>
            )}

            {/* Campo: Email (Visible en login, register y forgot) */}
            {mode !== "reset" && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input required type="email" placeholder="scout@correo.com" value={email} onChange={e => setEmail(e.target.value)}
                         className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                          style={{ borderColor: email ? "#622599" : "#e8eaf2", background: "#f8f5ff" }} />
                </div>
              </div>
            )}

            {/* Campo: Contraseña (Visible en login, register y reset) */}
            {mode !== "forgot" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {mode === "reset" ? "Nueva Contraseña" : "Contraseña"}
                  </label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs font-semibold text-purple-600 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                         className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                          style={{ borderColor: password ? "#622599" : "#e8eaf2", background: "#f8f5ff" }} />
                </div>
              </div>
            )}

            {/* Campo adicional: Confirmar Contraseña (Solo en Modo 'reset') */}
            {mode === "reset" && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input required type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                         className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                          style={{ borderColor: confirmPassword ? "#622599" : "#e8eaf2", background: "#f8f5ff" }} />
                </div>
              </div>
            )}

            {/* Botón de Envío Dinámico */}
            <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all mt-2 disabled:opacity-50"
                 style={{ background: "linear-gradient(135deg, #622599, #4a1c75)" }}>
              {loading ? (
                <span className="animate-pulse">PROCESANDO...</span>
              ) : mode === "reset" ? (
                <>
                  <CheckCircle className="w-4 h-4" /> ACTUALIZAR CONTRASEÑA
                </>
              ) : mode === "forgot" ? (
                <>
                  <KeyRound className="w-4 h-4" /> ENVIAR ENLACE DE RECUPERACIÓN
                </>
              ) : mode === "register" ? (
                <>
                  <UserPlus className="w-4 h-4" /> REGISTRARME
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> INICIAR SESIÓN
                </>
              )}
            </button>
          </form>

          {/* Selector / Switcher de Opción */}
          <div className="mt-6 text-center">
            {mode === "forgot" || mode === "reset" ? (
              <button onClick={() => setMode("login")} className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
              </button>
            ) : (
              <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-xs font-bold text-purple-600 hover:underline transition-colors">
                {mode === "register" ? "¿Ya tienes una cuenta? Inicia sesión aquí" : "¿No tienes una cuenta? Regístrate e intégrate aquí"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}