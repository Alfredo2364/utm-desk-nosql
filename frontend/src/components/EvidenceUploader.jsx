import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Shield,
} from 'lucide-react';
import { uploadEvidencia } from '../services/api';

export default function EvidenceUploader({ codigo, onEvidenceUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subidoPor, setSubidoPor] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Megabytes
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
  ];

  const validateFile = (file) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file) return false;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMsg(
        'Formato no válido. Solo se admiten imágenes JPG, PNG y documentos PDF.'
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(
        `El archivo (${mbSize} MB) supera el límite máximo permitido de 5 MB.`
      );
      return false;
    }

    return true;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await uploadEvidencia(
        codigo,
        selectedFile,
        subidoPor.trim() || 'Técnico Campus'
      );

      setSuccessMsg('¡Archivo subido exitosamente a Supabase Storage y vinculado en MongoDB!');
      setSelectedFile(null);
      setSubidoPor('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onEvidenceUploaded) {
        onEvidenceUploaded(result.evidencia);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la carga del archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Adjuntar Evidencia Fotográfica o Documental
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Límite 5MB • JPG, PNG o PDF
        </span>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Error de validación: </span>
            {errorMsg}
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alerta de Éxito */}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Zona Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-teal-500 bg-teal-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/60 bg-slate-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${
              isDragging ? 'bg-teal-600 text-white scale-110' : 'bg-teal-100 text-teal-700'
            }`}
          >
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="text-xs">
            <span className="font-bold text-slate-800">
              Arrastra y suelta tu archivo aquí
            </span>{' '}
            o <span className="text-teal-600 font-semibold underline">haz clic para examinar</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Imágenes de fallas (.jpg, .png) o reportes técnicos escaneados (.pdf) hasta 5 MB
          </p>
        </div>
      </div>

      {/* Archivo Seleccionado y Acciones */}
      {selectedFile && (
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-teal-600">
                {selectedFile.type === 'application/pdf' ? (
                  <FileText className="w-5 h-5 text-rose-600" />
                ) : (
                  <Image className="w-5 h-5 text-teal-600" />
                )}
              </div>
              <div className="overflow-hidden text-xs">
                <span className="font-semibold text-slate-900 truncate block">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatSize(selectedFile.size)} • {selectedFile.type}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={isUploading}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-xs">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Nombre de quien adjunta (Opcional)"
                value={subidoPor}
                onChange={(e) => setSubidoPor(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-sm shadow-teal-600/30 transition-all disabled:opacity-50 text-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Subiendo a Supabase...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Subir Evidencia</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
