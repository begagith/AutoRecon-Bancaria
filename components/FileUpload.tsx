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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center text-center h-full">
      <div className="bg-blue-50 p-3 rounded-full mb-4">
        <DocumentTextIcon className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">
        Soporta Excel (.xlsx) o PDF estándar.
      </p>

      {currentFile ? (
        <div className="w-full bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span className="truncate font-medium text-sm">{currentFile.name}</span>
          <button 
            onClick={() => {/* reset logic would go here */}}
            className="text-xs hover:underline"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <label className="w-full cursor-pointer group">
          <div className="w-full border-2 border-dashed border-slate-300 rounded-lg py-8 px-4 group-hover:border-blue-500 transition-colors flex flex-col items-center justify-center">
            <ArrowUpTrayIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-2" />
            <span className="text-sm text-slate-600 font-medium">Subir archivo</span>
            <input 
              type="file" 
              className="hidden" 
              accept={accept}
              onChange={handleChange}
            />
          </div>
        </label>
      )}

      <div className="mt-4 w-full">
        <button 
          onClick={onLoadDemo}
          className="text-xs text-blue-600 font-medium hover:text-blue-800 underline"
        >
          Usar datos de prueba (Demo)
        </button>
      </div>
    </div>
  );
};