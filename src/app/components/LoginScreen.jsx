import { useState } from "react";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";
import { supabase } from "../lib/supabase"; // Asegúrate de que la ruta a tu archivo de supabase sea correcta

export default function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Por favor completa los campos.");
    setLoading(true);

    if (isRegistering) {
      // ─── REGISTRO DE NUEVO USUARIO ───
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
          role: "user", // Por defecto todos entran como Scouts/Alumnos
          role_label: "Scout de Tropa",
          avatar: initials || "ST"
        }]);

        if (profileError) {
          alert("Usuario creado en Auth, pero hubo un problema al guardar el perfil: " + profileError.message);
        } else {
          alert("¡Cuenta Scout creada con éxito! Ya puedes iniciar sesión.");
          setIsRegistering(false);
        }
      }
    } else {
      // ─── INICIO DE SESIÓN DE USUARIO EXISITENTE ───
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert("Error de credenciales: " + error.message);
      } else if (data?.user) {
        // Al iniciar sesión de forma exitosa, notificamos al App.js para que cargue el dashboard
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
              {isRegistering ? "Crear Cuenta Scout" : "Aula Virtual Scout"}
            </h1>
            <p className="text-xs text-gray-400 mt-1 text-center px-4">
              {isRegistering ? "Únete a la hermandad scout y empieza tu progresión" : "Ingresa tus credenciales para acceder a tus insignias y cursos"}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
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

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-gray-400 absolute left-4" />
                <input required type="email" placeholder="scout@correo.com" value={email} onChange={e => setEmail(e.target.value)}
                       className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                       style={{ borderColor: email ? "#7c3aed" : "#e8eaf2", background: "#f8f5ff" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-gray-400 absolute left-4" />
                <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                       className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                       style={{ borderColor: password ? "#7c3aed" : "#e8eaf2", background: "#f8f5ff" }} />
              </div>
            </div>

            {/* Botón de Envío */}
            <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all mt-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
              {loading ? (
                <span className="animate-pulse">PROCESANDO...</span>
              ) : isRegistering ? (
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
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-bold text-purple-600 hover:underline transition-colors">
              {isRegistering ? "¿Ya tienes una cuenta? Inicia sesión aquí" : "¿No tienes una cuenta? Regístrate e intégrate aquí"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}