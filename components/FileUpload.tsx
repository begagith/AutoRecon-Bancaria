import React, { ChangeEvent } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  title: string;
  accept: string;
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  onLoadDemo: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ title, accept, onFileSelect, currentFile, onLoadDemo }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center h-full transition-all hover:shadow-md">
      <div className="bg-blue-50 p-4 rounded-full mb-4">
        <DocumentTextIcon className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 px-4">
        Formato soportado: Excel (.xlsx) o PDF. Asegúrese de que las columnas coincidan con el formato estándar.
      </p>

      {currentFile ? (
        <div className="w-full bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
             <DocumentTextIcon className="w-5 h-5 flex-shrink-0" />
             <span className="truncate font-medium text-sm">{currentFile.name}</span>
          </div>
          <button 
            onClick={() => { onFileSelect(null as any); }}
            className="text-xs font-semibold hover:text-green-900 bg-green-100 px-2 py-1 rounded ml-2"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <label className="w-full cursor-pointer group">
          <div className="w-full border-2 border-dashed border-slate-300 rounded-xl py-10 px-4 group-hover:border-blue-500 group-hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center">
            <ArrowUpTrayIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-3" />
            <span className="text-sm text-slate-700 font-semibold group-hover:text-blue-600">Haga clic para subir archivo</span>
            <span className="text-xs text-slate-400 mt-1">o arrastre y suelte aquí</span>
            <input 
              type="file" 
              className="hidden" 
              accept={accept}
              onChange={handleChange}
            />
          </div>
        </label>
      )}

      <div className="mt-6 pt-6 border-t border-slate-100 w-full">
        <p className="text-xs text-slate-400 mb-2">¿No tiene archivos a mano?</p>
        <button 
          onClick={onLoadDemo}
          className="text-sm text-blue-600 font-semibold hover:text-blue-800 hover:underline decoration-2 underline-offset-2"
        >
          Cargar datos de demostración
        </button>
      </div>
    </div>
  );
};