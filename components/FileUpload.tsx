import React, { useCallback } from 'react';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300
      ${isLoading ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-50' : 'border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer bg-white shadow-sm'}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="bg-indigo-100 p-4 rounded-full mb-4">
        <Upload className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Faça Upload dos Dados
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm">
        Arraste e solte seu arquivo Excel (.xlsx) ou CSV aqui.
      </p>
      
      <div className="flex gap-4 mb-6 text-xs text-gray-400 font-medium">
        <span className="flex items-center"><FileSpreadsheet className="w-4 h-4 mr-1"/> Excel</span>
        <span className="flex items-center"><FileText className="w-4 h-4 mr-1"/> CSV</span>
      </div>

      <label className="relative">
        <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept=".csv, .xlsx, .xls"
            disabled={isLoading}
        />
        <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md shadow-indigo-200">
          {isLoading ? 'Processando...' : 'Selecionar Arquivo'}
        </span>
      </label>
    </div>
  );
};

export default FileUpload;