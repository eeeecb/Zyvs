'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface ImportDropzoneProps {
  onFileAccepted: (file: File) => void;
  onDownloadTemplate: () => void;
}

export function ImportDropzone({ onFileAccepted, onDownloadTemplate }: ImportDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <motion.div
        {...getRootProps()}
        className={`
          relative border-4 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-[#00ff88] bg-[#00ff88]/5 scale-105'
            : 'border-black/20 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          {/* Icon */}
          <motion.div
            className="flex justify-center"
            animate={isDragActive ? { y: -10 } : { y: 0 }}
          >
            <div className="p-6 bg-[#00ff88] rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Upload className="w-12 h-12 text-black" />
            </div>
          </motion.div>

          {/* Text */}
          <div>
            <h3 className="text-2xl font-black mb-2">
              {isDragActive ? 'Solte o arquivo aqui!' : 'Arraste ou clique para enviar'}
            </h3>
            <p className="text-black/60">
              Formatos aceitos: <span className="font-bold">CSV, XLS, XLSX</span>
            </p>
            <p className="text-black/60 text-sm">
              Tamanho máximo: <span className="font-bold">10MB</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#ff3366]/10 border-4 border-[#ff3366] rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#ff3366] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#ff3366] mb-1">Erro ao enviar arquivo:</p>
              {fileRejections.map(({ file, errors }) => (
                <div key={file.name} className="text-sm text-black/70">
                  {errors.map(e => (
                    <p key={e.code}>
                      {e.code === 'file-too-large' && 'Arquivo muito grande (máx 10MB)'}
                      {e.code === 'file-invalid-type' && 'Formato não suportado'}
                      {e.code === 'too-many-files' && 'Envie apenas um arquivo por vez'}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Download Template Button */}
      <div className="flex justify-center">
        <button
          onClick={onDownloadTemplate}
          className="
            flex items-center gap-2 px-6 py-3
            bg-white border-4 border-black rounded-xl
            font-black text-lg
            shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
            hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
            hover:translate-x-[-2px] hover:translate-y-[-2px]
            transition-all duration-200
          "
        >
          <FileSpreadsheet className="w-5 h-5" />
          Baixar Template CSV
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-[#ffeb3b]/10 border-4 border-[#ffeb3b] rounded-xl p-6">
        <h4 className="font-black text-lg mb-3 flex items-center gap-2">
          <span>💡</span> Como importar seus contatos:
        </h4>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Baixe o template CSV e preencha com seus dados</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Certifique-se de que pelo menos <span className="font-bold">nome OU email</span> esteja preenchido</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Tags devem ser separadas por vírgula (ex: &quot;cliente,vip,sp&quot;)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>Arquivos pequenos (&lt;500 contatos) são processados instantaneamente</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>Arquivos grandes são processados em segundo plano</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
