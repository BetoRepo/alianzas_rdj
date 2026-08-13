import { useState } from "react";
import { LogIn, UserPlus, Mail, Lock, User, KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase"; // Asegúrate de que la ruta sea correcta

export default function LoginScreen({ onLogin }) {
  // Modos posibles: "login" | "register" | "forgot"
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ─── OPCIÓN 1: RESTABLECER CONTRASEÑA ───
    if (mode === "forgot") {
      if (!email) return alert("Por favor introduce tu correo electrónico.");
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, // Cambia esta URL si usas un enlace específico
      });

      setLoading(false);

      if (error) {
        alert("Error al enviar el correo: " + error.message);
      } else {
        alert("¡Enlace enviado! Revisa tu bandeja de entrada o spam para restablecer tu contraseña.");
        setMode("login");
      }
      return;
    }

    // Validación base para Login y Registro
    if (!email || !password) return alert("Por favor completa los campos.");
    setLoading(true);

    if (mode === "register") {
      // ─── OPCIÓN 2: REGISTRO DE NUEVO USUARIO ───
      if (!name) {
        alert("Por favor introduce tu nombre.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (authError) {
        alert("Error al registrar: " + authError.message);
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
          alert("Usuario creado en Auth, pero hubo un problema al guardar el perfil: " + profileError.message);
        } else {
          alert("¡Cuenta Scout creada con éxito! Ya puedes iniciar sesión.");
          setMode("login");
        }
      }
    } else {
      // ─── OPCIÓN 3: INICIO DE SESIÓN DE USUARIO EXISTENTE ───
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert("Error de credenciales: " + error.message);
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
                 style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
              <span className="text-white font-black text-xl tracking-tighter" style={{ fontFamily: "Nunito, sans-serif" }}>S</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
              {mode === "register" 
                ? "Crear Cuenta Scout" 
                : mode === "forgot" 
                ? "Recuperar Contraseña" 
                : "Aula Virtual Scout"}
            </h1>
            <p className="text-xs text-gray-400 mt-1 text-center px-4">
              {mode === "register" 
                ? "Únete a la hermandad scout y empieza tu progresión" 
                : mode === "forgot"
                ? "Ingresa tu correo y te enviaremos un enlace de recuperación"
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
                         style={{ borderColor: name ? "#7c3aed" : "#e8eaf2", background: "#f8f5ff" }} />
                </div>
              </div>
            )}

            {/* Campo: Email (Visible en todos los modos) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-gray-400 absolute left-4" />
                <input required type="email" placeholder="scout@correo.com" value={email} onChange={e => setEmail(e.target.value)}
                       className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                       style={{ borderColor: email ? "#7c3aed" : "#e8eaf2", background: "#f8f5ff" }} />
              </div>
            </div>

            {/* Campo: Contraseña (No se muestra en modo 'forgot') */}
            {mode !== "forgot" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Contraseña</label>
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
                         style={{ borderColor: password ? "#7c3aed" : "#e8eaf2", background: "#f8f5ff" }} />
                </div>
              </div>
            )}

            {/* Botón de Envío Dinámico */}
            <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all mt-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
              {loading ? (
                <span className="animate-pulse">PROCESANDO...</span>
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
            {mode === "forgot" ? (
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