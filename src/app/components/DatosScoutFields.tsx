import type { ReactNode } from "react";
import { Cake, Users, MapPin, Map as MapIcon, Tent } from "lucide-react";
import { UNIDADES, calcularEdad, ramaDeUnidad, type DatosScout } from "../lib/profile";

export function datosScoutDe(profile: any): DatosScout {
  return {
    fecha_nacimiento: profile?.fecha_nacimiento || "",
    grupo: profile?.grupo || "",
    region: profile?.region || "",
    distrito: profile?.distrito || "",
    unidad: profile?.unidad || ""
  };
}

const inputClass =
  "w-full text-xs bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-500 focus:bg-white font-medium text-gray-800";

function Campo({ icon: Icon, label, children }: { icon: typeof Cake; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-purple-600" /> {label}
      </label>
      {children}
    </div>
  );
}

// Campos de fecha de nacimiento, grupo, región, distrito y unidad (con su rama)
export function DatosScoutFields({ value, onChange }: { value: DatosScout; onChange: (v: DatosScout) => void }) {
  const set = (field: keyof DatosScout) => (e: { target: { value: string } }) => onChange({ ...value, [field]: e.target.value });
  const edad = calcularEdad(value.fecha_nacimiento);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo icon={Cake} label="Fecha de Nacimiento">
          <input type="date" max={hoy} value={value.fecha_nacimiento} onChange={set("fecha_nacimiento")} className={inputClass} required />
          {edad !== null && edad >= 0 && <p className="text-[11px] text-gray-500 font-medium">Edad: {edad} años</p>}
        </Campo>
        <Campo icon={Users} label="Grupo">
          <input type="text" placeholder="Ej: Grupo Scout 15 San José" value={value.grupo} onChange={set("grupo")} className={inputClass} required />
        </Campo>
        <Campo icon={MapIcon} label="Región">
          <input type="text" placeholder="Tu región scout" value={value.region} onChange={set("region")} className={inputClass} required />
        </Campo>
        <Campo icon={MapPin} label="Distrito">
          <input type="text" placeholder="Tu distrito scout" value={value.distrito} onChange={set("distrito")} className={inputClass} required />
        </Campo>
      </div>

      <Campo icon={Tent} label="Unidad">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UNIDADES.map(({ unidad, rama }) => {
            const selected = value.unidad === unidad;
            return (
              <button
                key={unidad}
                type="button"
                onClick={() => onChange({ ...value, unidad })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selected ? "bg-purple-600 border-purple-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-800 hover:border-purple-300"
                }`}
              >
                <p className="text-xs font-black">{unidad}</p>
                <p className={`text-[11px] font-medium ${selected ? "text-purple-100" : "text-gray-500"}`}>{rama}</p>
              </button>
            );
          })}
        </div>
        {ramaDeUnidad(value.unidad) && (
          <p className="text-[11px] text-purple-700 font-bold">Eres {ramaDeUnidad(value.unidad)}</p>
        )}
      </Campo>
    </div>
  );
}
