import { useState, useEffect, FormEvent } from "react";
import { Search, PlusCircle, Trash2, X, Shield, UserCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

export function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error al cargar usuarios:", error.message);
    else setUsers(data || []);
    setLoading(false);
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !name.trim()) {
      return alert("Por favor completa todos los campos requeridos.");
    }

    setCreating(true);
    try {
      // 1. Registro en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (authError) throw authError;

      // 2. Inserción de Perfil con Iniciales
      if (authData.user) {
        const initials = name
          .trim()
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "S";

        const { error: profileError } = await supabase.from("perfiles").insert([{
          id: authData.user.id,
          name,
          email,
          role: isAdmin ? "admin" : "user",
          role_label: isAdmin ? "Administrador / Dirigente" : "Scouter / Educador",
          avatar: initials,
          status: "Activo"
        }]);

        if (profileError) throw profileError;

        setShowModal(false);
        setEmail(""); setPassword(""); setName(""); setIsAdmin(false);
        await fetchUsers();
      }
    } catch (err: any) {
      alert("Error al registrar usuario: " + (err.message || err));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser(id: string) {
    if (confirm("¿Estás seguro de eliminar este usuario del sistema?")) {
      const { error } = await supabase.from("perfiles").delete().eq("id", id);
      if (error) {
        alert("No se pudo eliminar el perfil: " + error.message);
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    }
  }

  const filtered = users.filter((u) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Gestión de acceso</p>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>
            Directorio de Usuarios
          </h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm hover:opacity-95 shadow-md transition-all" 
          style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
        >
          <PlusCircle className="w-4 h-4" /> Registrar Usuario
        </button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border shadow-sm" style={{ borderColor: "rgba(91,33,182,0.12)" }}>
        <Search className="w-4 h-4 text-gray-400" />
        <input 
          placeholder="Buscar miembro por nombre o correo..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-700" 
        />
      </div>

      {/* Tabla/Lista de Usuarios */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "rgba(91,33,182,0.08)" }}>
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400 font-medium animate-pulse">
            Cargando directorio de la plataforma...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-400">
            No se encontraron usuarios coincidentes.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
            {filtered.map((u) => {
              const statusText = u.status || "Activo";
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-purple-50/40 transition-colors">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm" 
                    style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
                  >
                    {u.avatar || "S"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                      {u.name || "Usuario Sin Nombre"}
                      {u.role === "admin" && <Shield className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="text-xs text-gray-400">
                      {u.email} · <span className="font-medium text-purple-700">{u.role_label || u.role}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    statusText === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {statusText}
                  </span>

                  <button 
                    onClick={() => handleDeleteUser(u.id)} 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-fade-in">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-black text-gray-900 mb-4" style={{ fontFamily: "Nunito, sans-serif" }}>
              Registrar Miembro Scout
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ej: Baden Powell"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-xl outline-none text-xs focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Institucional</label>
                <input 
                  required 
                  type="email" 
                  placeholder="usuario@scout.org"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-xl outline-none text-xs focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña Inicial</label>
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-xl outline-none text-xs focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="admin" 
                  checked={isAdmin} 
                  onChange={(e) => setIsAdmin(e.target.checked)} 
                  className="w-4 h-4 accent-purple-600 rounded" 
                />
                <label htmlFor="admin" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Asignar Rol de Administrador (Scouter Dirigente)
                </label>
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full py-3 rounded-xl font-bold text-white text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2" 
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
              >
                <UserCheck className="w-4 h-4" />
                {creating ? "Guardando Registro..." : "Registrar y Guardar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}