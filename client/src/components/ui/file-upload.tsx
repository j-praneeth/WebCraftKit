import React, { ChangeEvent } from 'react';
import { Input } from './input';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  onChange: (file: File | null) => void;
}

export function FileUpload({ accept, onChange }: FileUploadProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      e.target.value = '';
      onChange(null);
      return;
    }
    
    onChange(file);
  };

  return (
    <div className="relative">
      <Input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
      />
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Drag and drop your file here, or click to select
        </p>
      </div>
    </div>
  );
} 