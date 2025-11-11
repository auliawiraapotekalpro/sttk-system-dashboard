import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelect: (files: File[]) => void;
  multiple?: boolean;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, multiple = false, required = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    if (selectedFiles.length > 0) {
      onFileSelect(selectedFiles);
    }
    // Selalu bersihkan nilai input untuk memungkinkan pemilihan ulang file yang sama
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFiles = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : [];
    if (droppedFiles.length > 0) {
      onFileSelect(droppedFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div 
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors hover:border-blue-400"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="space-y-1 text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor={label.replace(/\s+/g, '-')}
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Upload file(s)</span>
              <input
                id={label.replace(/\s+/g, '-')}
                name={label.replace(/\s+/g, '-')}
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                multiple={multiple}
                ref={fileInputRef}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
        </div>
      </div>
    </div>
  );
};
