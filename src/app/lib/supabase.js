import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const DEFAULT_STORAGE_BUCKET = "bucket"; // change to your bucket name

/**
 * Return a usable URL for a stored file.
 * If `content` is already an http(s) URL, returns it directly.
 * Otherwise treats `content` as a storage path (relative to bucket) and
 * returns a signed URL valid for `expires` seconds (default 3600).
 */
export async function getFileUrl(content, expires = 3600) {
	if (!content) return "";
	if (/^https?:\/\//i.test(content)) return content;
	const path = String(content).replace(/^\//, "");
	const { data, error } = await supabase.storage.from(DEFAULT_STORAGE_BUCKET).createSignedUrl(path, expires);
	if (error || !data) return "";
	return data.signedUrl;
}