import { useState, type DragEvent } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { subirArchivo } from "../../lib/supabase";

// Subir una imagen (clic o arrastrar y soltar) con vista previa; también acepta una URL
export function ImageUpload({
  value,
  onChange,
  carpeta,
  label = "Imagen de portada",
  heightClass = "h-36"
}: {
  value: string;
  onChange: (url: string) => void;
  carpeta: string;
  label?: string;
  heightClass?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.warning("El archivo debe ser una imagen (JPG, PNG, WEBP...).");
    setUploading(true);
    try {
      onChange(await subirArchivo(file, carpeta));
    } catch (err: any) {
      toast.error("Error subiendo la imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  const picker = (
    <input type="file" accept="image/*" className="hidden" onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }} />
  );

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-bold text-gray-700">{label}</span>
      {value ? (
        <div className={`relative ${heightClass} rounded-2xl overflow-hidden border border-gray-200 group`}>
          <img src={value} alt="Vista previa de la portada" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Cambiar
              {picker}
            </label>
            <button type="button" onClick={() => onChange("")} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Quitar
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`${heightClass} cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center px-4 transition-colors ${
              dragging ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-gray-50/60 hover:border-purple-300 hover:bg-purple-50/40"
            }`}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-6 h-6 text-purple-500" />
                <span className="text-xs font-bold text-gray-700">Haz clic o arrastra una imagen aquí</span>
                <span className="text-[10px] text-gray-400">JPG, PNG o WEBP · horizontal se ve mejor</span>
              </>
            )}
            {picker}
          </label>
          <input
            type="url"
            placeholder="o pega la URL de una imagen"
            aria-label={`URL de ${label.toLowerCase()}`}
            onBlur={(e) => e.target.value.trim() && onChange(e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </>
      )}
    </div>
  );
}
