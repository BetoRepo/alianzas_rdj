import type { jsPDF } from "jspdf";

export const CERTIFICADO_FONDO_URL =
  "https://jjhcwaopnwfevbuirxku.supabase.co/storage/v1/object/public/bucket/Certificado%20de%20Reconocimiento%20Elegante%20Verde%20y%20Beige.png";

// Carga la imagen de fondo y la pasa a JPEG: el PNG original haría un PDF de ~8 MB
async function cargarImagen(url: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  try {
    await img.decode();
  } catch {
    throw new Error("No se pudo cargar la imagen del certificado.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9);
}

const PT_A_MM = 0.3528;

// Mayor tamaño de letra (entre max y min) con el que el texto cabe en maxLines líneas
function ajustarTexto(doc: jsPDF, texto: string, maxWidth: number, max: number, min: number, maxLines: number) {
  let size = max;
  let lines = doc.setFontSize(size).splitTextToSize(texto, maxWidth) as string[];
  while (lines.length > maxLines && size > min) {
    size -= 1;
    lines = doc.setFontSize(size).splitTextToSize(texto, maxWidth) as string[];
  }
  return { lines, size };
}

// Genera y descarga el certificado en PDF (A4 horizontal). Las posiciones son
// fracciones del alto, medidas sobre la imagen de fondo.
export async function descargarCertificadoPDF(nombre: string, curso: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.addImage(await cargarImagen(CERTIFICADO_FONDO_URL), "JPEG", 0, 0, W, H);

  // Nombre: justo encima de la línea del fondo (52% del alto)
  doc.setFont("times", "bold").setTextColor(17, 17, 17);
  const nombreFit = ajustarTexto(doc, nombre, W * 0.6, 26, 14, 1);
  doc.setFontSize(nombreFit.size).text(nombreFit.lines[0], W / 2, H * 0.505, { align: "center" });

  // Curso: entre "Ha aprobado el curso de" y "Certificando que..." (61%–71% del alto);
  // en una línea si cabe, si no en dos con letra más chica
  doc.setFont("helvetica", "bold").setTextColor(107, 33, 168);
  const titulo = curso.toUpperCase();
  let cursoFit = ajustarTexto(doc, titulo, W * 0.8, 24, 16, 1);
  if (cursoFit.lines.length > 1) cursoFit = ajustarTexto(doc, titulo, W * 0.8, 15, 9, 2);
  const lineHeight = cursoFit.size * PT_A_MM * 1.15;
  const firstBaseline = H * 0.66 - ((cursoFit.lines.length - 1) * lineHeight) / 2 + cursoFit.size * PT_A_MM * 0.35;
  doc.setFontSize(cursoFit.size).text(cursoFit.lines.slice(0, 2), W / 2, firstBaseline, { align: "center", lineHeightFactor: 1.15 });

  const archivo = `Certificado - ${curso}`.replace(/[\\/:*?"<>|]/g, "").trim();
  doc.save(`${archivo}.pdf`);
}
