import React, { useCallback } from 'react';
import { Upload, X, File, ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // bytes
  files: File[];
  onChange: (files: File[]) => void;
  hint?: string;
  required?: boolean;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext ?? '')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  return <File className="w-4 h-4 text-orange-500" />;
}

export default function FileUpload({
  label,
  accept = '.jpg,.jpeg,.png,.pdf',
  multiple = false,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  files,
  onChange,
  hint,
  required,
}: FileUploadProps) {
  const [dragOver, setDragOver] = React.useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles = Array.from(incoming).filter(
      (f) => f.size <= maxSize && !files.find((e) => e.name === f.name && e.size === f.size)
    );
    const merged = multiple ? [...files, ...newFiles].slice(0, maxFiles) : [newFiles[0] ?? files[0]].filter(Boolean);
    onChange(merged);
  }, [files, multiple, maxFiles, maxSize, onChange]);

  const removeFile = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <label
        className={`drop-zone block ${dragOver ? 'border-royal-500 bg-blue-50' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          <span className="text-royal-500 font-semibold">Click to upload</span> or drag and drop
        </p>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {accept.split(',').join(', ').toUpperCase().replace(/\./g, '')} &mdash; Max {formatBytes(maxSize)}
          {multiple && ` &mdash; Up to ${maxFiles} files`}
        </p>
      </label>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 bg-gray-50 border border-cpecb-border rounded-lg px-3 py-2">
              <FileIcon name={f.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-900 font-medium truncate">{f.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
