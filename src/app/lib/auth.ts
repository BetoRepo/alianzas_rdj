import { supabase, getSessionToken, setSessionToken } from "./supabase";

// Cuentas guardadas en public.usuarios; ver sql/usuarios_propios.sql

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

type SessionResponse = { token: string; usuario: any };

export async function registrar(name: string, email: string, password: string) {
  const { token, usuario } = await rpc<SessionResponse>("registrar_usuario", {
    p_name: name,
    p_email: email,
    p_password: password
  });
  setSessionToken(token);
  return usuario;
}

export async function iniciarSesion(email: string, password: string) {
  const { token, usuario } = await rpc<SessionResponse>("iniciar_sesion", { p_email: email, p_password: password });
  setSessionToken(token);
  return usuario;
}

// Devuelve el usuario de la sesión guardada, o null si no hay o caducó
export async function usuarioActual() {
  if (!getSessionToken()) return null;
  try {
    const usuario = await rpc<any>("mi_usuario");
    if (!usuario) setSessionToken(null);
    return usuario;
  } catch {
    return null;
  }
}

export async function cerrarSesion() {
  try {
    await rpc("cerrar_sesion");
  } finally {
    setSessionToken(null);
  }
}

export function adminCrearUsuario(name: string, email: string, password: string, esAdmin: boolean) {
  return rpc<string>("admin_crear_usuario", { p_name: name, p_email: email, p_password: password, p_es_admin: esAdmin });
}

export function adminCambiarPassword(usuarioId: string, nueva: string) {
  return rpc<void>("admin_cambiar_password", { p_usuario_id: usuarioId, p_nueva: nueva });
}
