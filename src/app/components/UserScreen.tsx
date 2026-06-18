import { useState, useEffect } from "react";
import { Search, PlusCircle, Trash2, Eye, X } from "lucide-react";
import { supabase } from "../lib/supabase";

export function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de Nuevo Usuario
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
    const { data, error } = await supabase.from("perfiles").select("*");
    if (!error && data) setUsers(data);
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    // 1. Crear usuario en la sección Auth de Supabase usando su API Edge Function o servicio de registro directo
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name } }
    });

    if (authError) return alert(authError.message);

    // 2. Insertar perfil en la tabla personalizada (Si no se dispara por Trigger)
    if (authData.user) {
      const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      const { error: profileError } = await supabase.from("perfiles").insert([{
        id: authData.user.id,
        name,
        email,
        role: isAdmin ? "admin" : "user",
        role_label: isAdmin ? "Administradora" : "Scouter de Tropa",
        avatar: initials
      }]);

      if (profileError) alert(profileError.message);
      else {
        setShowModal(false);
        fetchUsers();
        // Limpiar campos
        setEmail(""); setPassword(""); setName(""); setIsAdmin(false);
      }
    }
  }

  async function handleDeleteUser(id: string) {
    if (confirm("¿Estás seguro de eliminar este usuario del sistema?")) {
      const { error } = await supabase.from("perfiles").delete().eq("id", id);
      if (!error) setUsers(users.filter(u => u.id !== id));
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Gestión de acceso</p>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Nunito, sans-serif" }}>Usuarios</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all" 
          style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
        >
          <PlusCircle className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border" style={{ borderColor: "rgba(91,33,182,0.12)" }}>
        <Search className="w-4 h-4 text-gray-400" />
        <input placeholder="Buscar por nombre o correo..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-700" />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(91,33,182,0.08)" }}>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Cargando base de datos scout...</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(91,33,182,0.06)" }}>
            {filtered.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-violet-50/30 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>{u.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.email} · {u.role_label}</div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${u.status === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{u.status}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleDeleteUser(u.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN CON TU MISMA IDENTIDAD DE DISEÑO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-4" style={{ fontFamily: "Nunito, sans-serif" }}>Registrar Miembro Scout</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre Completo</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Institucional</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Contraseña Inicial</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none" />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input type="checkbox" id="admin" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                <label htmlFor="admin" className="text-xs font-bold text-gray-700">Asignar Rol de Administrador (Scouter Dirigente)</label>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                Registrar y Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}