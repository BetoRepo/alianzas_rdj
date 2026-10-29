import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Los usuarios viven en la tabla public.usuarios (no en Supabase Auth).
// El token de sesión que devuelve iniciar_sesion() se manda en la cabecera
// "x-session-token" de cada petición; las reglas RLS lo usan para saber quién es.
const TOKEN_KEY = "alianzas_session_token";

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin localStorage la sesión dura solo mientras la pestaña esté abierta
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: {
    fetch: (input, init = {}) => {
      const headers = new Headers(init.headers);
      const token = getSessionToken();
      if (token) headers.set("x-session-token", token);
      return fetch(input, { ...init, headers });
    }
  }
});

export const DEFAULT_STORAGE_BUCKET = "bucket"; // change to your bucket name

/**
 * Return a usable URL for a stored file.
 * If `content` is already an http(s) URL, returns it directly.
 * Otherwise treats `content` as a storage path (relative to bucket) and
 * returns a signed URL valid for `expires` seconds (default 3600).
 */
export async function getFileUrl(content: string, expires = 3600) {
	if (!content) return "";
	if (/^https?:\/\//i.test(content)) return content;
	const path = String(content).replace(/^\//, "");
	const { data, error } = await supabase.storage.from(DEFAULT_STORAGE_BUCKET).createSignedUrl(path, expires);
	if (error || !data) return "";
	return data.signedUrl;
}