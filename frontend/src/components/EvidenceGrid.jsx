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
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Paperclip className="w-4 h-4 text-slate-700" />
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Bóveda de Evidencias Adjuntas ({evidencias.length})
          </h3>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bucket Privado Supabase • Firmadas 6 días</span>
        </div>
      </div>

      {evidencias.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-md border border-dashed border-slate-200">
          No hay evidencias adjuntas para este expediente aún. Usa la zona de carga para vincular imágenes o actas PDF.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {evidencias.map((evi, idx) => {
            const esImagen = isImage(evi.tipo_mime);
            const esPdfDoc = isPdf(evi.tipo_mime);

            return (
              <div
                key={evi._id || idx}
                className="group relative bg-slate-50 border border-slate-200 rounded-md overflow-hidden hover:border-slate-400 transition-all flex flex-col justify-between"
              >
                {/* Visual Preview */}
                <div className="relative h-32 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200">
                  {esImagen ? (
                    <img
                      src={evi.url_firmada}
                      alt={evi.nombre_original || 'Evidencia'}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x200?text=Evidencia+Guardada';
                      }}
                    />
                  ) : esPdfDoc ? (
                    <div className="flex flex-col items-center justify-center text-slate-600 p-3">
                      <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center mb-1">
                        <FileText className="w-5 h-5 text-slate-700" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono bg-slate-200 px-1.5 py-0.2 rounded text-slate-800">
                        Documento PDF
                      </span>
                    </div>
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400" />
                  )}

                  {/* Overlay Action Button */}
                  <a
                    href={evi.url_firmada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver en Supabase</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Metadata Card Footer */}
                <div className="p-2.5 text-xs space-y-1 bg-white">
                  <div className="flex items-start justify-between gap-1">
                    <span
                      title={evi.nombre_original}
                      className="font-medium text-slate-900 truncate block text-[11px]"
                    >
                      {evi.nombre_original || evi.nombre_archivo}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded shrink-0">
                      {formatBytes(evi.tamanio_bytes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                    <span>
                      {new Date(evi.fecha_subida).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    {evi.ahorro_compresion && evi.ahorro_compresion !== '0%' ? (
                      <span
                        title={`Optimizado HD: ${formatBytes(evi.tamanio_original_bytes || 0)} → ${formatBytes(evi.tamanio_bytes)}`}
                        className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[9px] font-bold"
                      >
                        ⚡ -{evi.ahorro_compresion} HD
                      </span>
                    ) : (
                      <span className="text-slate-600 font-semibold">
                        URL Segura 6d
                      </span>
                    )}
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
