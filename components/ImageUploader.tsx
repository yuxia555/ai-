import React, { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  selectedImage: string | null;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, selectedImage, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract base64 part only
      const base64 = result.split(',')[1];
      onImageSelected(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile, disabled]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative group w-full h-64 md:h-96 rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
        ${isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-zinc-900/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-500'}
      `}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input 
        type="file" 
        onChange={onInputChange} 
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed"
        disabled={disabled}
        accept="image/*"
      />
      
      {selectedImage ? (
        <div className="w-full h-full relative">
            <img 
              src={`data:image/png;base64,${selectedImage}`} 
              alt="Reference" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                 <span className="bg-black/70 text-white px-3 py-1 rounded text-xs font-mono backdrop-blur-md border border-white/10 tracking-widest">参考图已锁定</span>
            </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
          <svg className="w-12 h-12 mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-zinc-200">拖放参考图片</h3>
          <p className="text-sm mt-2 text-zinc-500">
            支持 JPG, PNG。此图片将决定生成的视觉风格。
          </p>
        </div>
      )}
    </div>
  );
};