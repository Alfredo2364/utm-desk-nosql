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

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 Megabytes (optimizado con Sharp en backend)
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
  ];

  const validateFile = (file) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file) return false;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMsg(
        'Formato no válido. Solo se admiten imágenes JPG, PNG, WEBP y documentos PDF.'
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(
        `El archivo (${mbSize} MB) supera el límite máximo permitido de 15 MB.`
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

      const ahorro = result.evidencia?.ahorro_compresion;
      if (ahorro && ahorro !== '0%') {
        setSuccessMsg(
          `¡Evidencia optimizada y vinculada! Compresión HD activa (Ahorro del ${ahorro} sin pérdida de nitidez).`
        );
      } else {
        setSuccessMsg('Archivo subido exitosamente a Supabase Storage y vinculado en MongoDB Atlas.');
      }
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
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <UploadCloud className="w-4 h-4 text-slate-700" />
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Zona de Carga de Evidencias (Supabase Storage)
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
            ⚡ Sharp HD Activo
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            MAX 15MB • JPG, PNG, WEBP, PDF
          </span>
        </div>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-start space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Error: </span>
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
        <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-emerald-800 text-xs">
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
        className={`relative border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-slate-800 bg-slate-50'
            : 'border-slate-300 hover:border-slate-500 bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-1.5">
          <UploadCloud className="w-6 h-6 text-slate-500" />
          <div className="text-xs">
            <span className="font-semibold text-slate-800">
              Arrastra un archivo aquí
            </span>{' '}
            o <span className="text-slate-900 underline font-semibold">examina tu equipo</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Fotografías (.jpg, .png) o reportes técnicos escaneados (.pdf) hasta 5 MB
          </p>
        </div>
      </div>

      {/* Archivo Seleccionado y Acciones */}
      {selectedFile && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden text-xs">
              <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-700">
                {selectedFile.type === 'application/pdf' ? (
                  <FileText className="w-4 h-4 text-slate-700" />
                ) : (
                  <Image className="w-4 h-4 text-slate-700" />
                )}
              </div>
              <div className="overflow-hidden">
                <span className="font-semibold text-slate-900 truncate block">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
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
              className="p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <X className="w-3.5 h-3.5" />
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
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs disabled:opacity-50 text-xs transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Subiendo...</span>
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
