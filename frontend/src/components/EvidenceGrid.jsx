import React from 'react';
import {
  Paperclip,
  FileText,
  ExternalLink,
  ShieldCheck,
  Calendar,
  HardDrive,
  Eye,
  Download,
} from 'lucide-react';

export default function EvidenceGrid({ evidencias = [] }) {
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mime) => mime?.startsWith('image/');
  const isPdf = (mime) => mime === 'application/pdf';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Paperclip className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Evidencias Adjuntas ({evidencias.length})
          </h3>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Bucket Privado Supabase (URLs firmadas 6 días)</span>
        </div>
      </div>

      {evidencias.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          No hay evidencias adjuntas para este expediente aún. Usa la zona de carga de abajo para adjuntar fotos o reportes PDF.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidencias.map((evi, idx) => {
            const esImagen = isImage(evi.tipo_mime);
            const esPdfDoc = isPdf(evi.tipo_mime);

            return (
              <div
                key={evi._id || idx}
                className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                {/* Visual Preview */}
                <div className="relative h-36 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200">
                  {esImagen ? (
                    <img
                      src={evi.url_firmada}
                      alt={evi.nombre_original || 'Evidencia'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x200?text=Evidencia+Guardada';
                      }}
                    />
                  ) : esPdfDoc ? (
                    <div className="flex flex-col items-center justify-center text-rose-600 p-4">
                      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                        Documento PDF
                      </span>
                    </div>
                  ) : (
                    <FileText className="w-8 h-8 text-slate-400" />
                  )}

                  {/* Overlay Action Button */}
                  <a
                    href={evi.url_firmada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver en Supabase</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Metadata Card Footer */}
                <div className="p-3 text-xs space-y-1.5 bg-white">
                  <div className="flex items-start justify-between gap-1">
                    <span
                      title={evi.nombre_original}
                      className="font-semibold text-slate-800 truncate block text-xs"
                    >
                      {evi.nombre_original || evi.nombre_archivo}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {formatBytes(evi.tamanio_bytes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(evi.fecha_subida).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-600 font-medium">
                      URL Segura 6d
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
