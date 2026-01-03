'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { ImportDropzone } from '@/components/contacts/ImportDropzone';
import { ColumnMapper } from '@/components/contacts/ColumnMapper';
import { ImportProgress } from '@/components/contacts/ImportProgress';

type Step = 'upload' | 'config' | 'processing' | 'result';

interface ImportConfig {
  skipDuplicates: boolean;
  updateExisting: boolean;
  createTags: boolean;
  columnMapping: Record<string, string>;
}

interface ImportResult {
  total: number;
  success: number;
  duplicates: number;
  errors: number;
  errorDetails: Array<{
    line: number;
    error: string;
  }>;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [config, setConfig] = useState<ImportConfig>({
    skipDuplicates: true,
    updateExisting: false,
    createTags: true,
    columnMapping: {},
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function handleFileAccepted(selectedFile: File) {
    setFile(selectedFile);

    try {
      const preview = await parseFilePreview(selectedFile);
      setPreview(preview.rows);
      setColumns(preview.columns);
      setRowCount(preview.total);

      // Auto-mapping de colunas comuns
      const autoMapping: Record<string, string> = {};
      preview.columns.forEach((col: string) => {
        const lower = col.toLowerCase();
        if (lower.includes('nome') || lower === 'name') autoMapping[col] = 'name';
        if (lower.includes('email') || lower === 'e-mail') autoMapping[col] = 'email';
        if (lower.includes('telefone') || lower.includes('phone') || lower.includes('celular'))
          autoMapping[col] = 'phone';
        if (lower.includes('empresa') || lower.includes('company')) autoMapping[col] = 'company';
        if (lower.includes('cargo') || lower.includes('position')) autoMapping[col] = 'position';
        if (lower.includes('cidade') || lower.includes('city')) autoMapping[col] = 'city';
        if (lower.includes('estado') || lower.includes('state')) autoMapping[col] = 'state';
        if (lower.includes('tag')) autoMapping[col] = 'tags';
        if (lower.includes('observ') || lower.includes('note')) autoMapping[col] = 'notes';
      });

      setConfig({ ...config, columnMapping: autoMapping });
      setStep('config');
    } catch (error) {
      alert('Erro ao ler arquivo. Verifique o formato.');
    }
  }

  async function parseFilePreview(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          preview: 10,
          complete: (results) => {
            resolve({
              columns: results.meta.fields || [],
              rows: results.data.slice(0, 5),
              total: results.data.length,
            });
          },
          error: reject,
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

            const columns = json.length > 0 ? Object.keys(json[0]) : [];
            resolve({
              columns,
              rows: json.slice(0, 5),
              total: json.length,
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  }

  async function handleImport() {
    if (!file) return;

    setProcessing(true);
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', String(config.skipDuplicates));
      formData.append('updateExisting', String(config.updateExisting));
      formData.append('createTags', String(config.createTags));
      formData.append('columnMapping', JSON.stringify(config.columnMapping));

      const response = await api.post('/api/contacts/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.type === 'sync') {
        // Resultado síncrono
        setResult(response.data.result);
        setStep('result');
        setProcessing(false);
      } else {
        // Assíncrono
        setJobId(response.data.jobId);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao importar');
      setProcessing(false);
      setStep('config');
    }
  }

  function handleImportComplete(importResult: any) {
    setResult(importResult);
    setStep('result');
    setProcessing(false);
  }

  function handleImportError(error: string) {
    alert(`Erro na importação: ${error}`);
    setProcessing(false);
    setStep('config');
  }

  function downloadTemplate() {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts/template`, '_blank');
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/clientes')}
            className="flex items-center gap-2 mb-6 px-4 py-2 bg-white border-2 border-gray-200 hover:border-[#00ff88] rounded font-bold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Contatos
          </button>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 bg-[#00ff88] border-2 border-black flex items-center justify-center">
              <Upload className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-black mb-2">
                Importar Contatos
              </h1>
              <p className="text-gray-600 font-medium">
                Envie um arquivo CSV ou Excel com seus contatos e configure a importação
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl">
            {[
              { id: 'upload', label: 'Upload' },
              { id: 'config', label: 'Configurar' },
              { id: 'processing', label: 'Processar' },
              { id: 'result', label: 'Resultado' },
            ].map((s, idx) => {
              const isActive = step === s.id;
              const isCompleted = ['upload', 'config', 'processing', 'result'].indexOf(step) > idx;

              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all
                        ${isActive
                          ? 'bg-[#00ff88] border-black scale-110'
                          : isCompleted
                          ? 'bg-[#00ff88] border-black'
                          : 'bg-white border-gray-300 text-gray-400'
                        }
                      `}
                    >
                      {idx + 1}
                    </div>
                    <p className={`mt-2 font-medium text-xs ${isActive ? 'text-black' : 'text-gray-500'}`}>
                      {s.label}
                    </p>
                  </div>
                  {idx < 3 && (
                    <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-[#00ff88]' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ImportDropzone
                onFileAccepted={handleFileAccepted}
                onDownloadTemplate={downloadTemplate}
              />
            </motion.div>
          )}

          {/* STEP 2: Config */}
          {step === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* File Info */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-1">{file?.name}</h3>
                    <p className="text-gray-600 font-medium">
                      <span className="text-[#00ff88] font-bold">{rowCount.toLocaleString()}</span> linhas encontradas
                    </p>
                  </div>
                  <button
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-[#00ff88] rounded font-bold text-sm transition"
                  >
                    Trocar arquivo
                  </button>
                </div>
              </div>

              {/* Column Mapper */}
              <ColumnMapper
                headers={columns}
                previewData={preview}
                columnMapping={config.columnMapping}
                onMappingChange={(mapping) => setConfig({ ...config, columnMapping: mapping })}
              />

              {/* Config Options */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-black mb-4">Opções de Importação</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border-2 border-gray-100 rounded cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      checked={config.skipDuplicates}
                      onChange={(e) => setConfig({ ...config, skipDuplicates: e.target.checked })}
                      className="w-5 h-5 mt-0.5 accent-[#00ff88]"
                    />
                    <div>
                      <p className="font-bold text-black">Pular duplicatas</p>
                      <p className="text-sm text-gray-600">Ignora contatos com emails já existentes no sistema</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 border-gray-100 rounded cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      checked={config.updateExisting}
                      onChange={(e) => setConfig({ ...config, updateExisting: e.target.checked })}
                      className="w-5 h-5 mt-0.5 accent-[#00ff88]"
                    />
                    <div>
                      <p className="font-bold text-black">Atualizar existentes</p>
                      <p className="text-sm text-gray-600">Atualiza dados de contatos que já existem (requer duplicatas ativadas)</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 border-gray-100 rounded cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      checked={config.createTags}
                      onChange={(e) => setConfig({ ...config, createTags: e.target.checked })}
                      className="w-5 h-5 mt-0.5 accent-[#00ff88]"
                    />
                    <div>
                      <p className="font-bold text-black">Criar tags automaticamente</p>
                      <p className="text-sm text-gray-600">Cria tags que não existem no sistema a partir do arquivo</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded font-bold transition"
                >
                  Voltar
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-6 py-3 bg-[#00ff88] hover:bg-[#00dd77] border-2 border-black text-black rounded font-bold transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Importar {rowCount.toLocaleString()} contatos
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Processing */}
          {step === 'processing' && jobId && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <ImportProgress
                jobId={jobId}
                onComplete={handleImportComplete}
                onError={handleImportError}
              />
            </motion.div>
          )}

          {step === 'processing' && !jobId && (
            <motion.div
              key="processing-sync"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-black border-t-[#00ff88] rounded-full animate-spin" />
              <h3 className="text-2xl font-bold text-black mb-2">Processando...</h3>
              <p className="text-gray-600">Importando seus contatos</p>
            </motion.div>
          )}

          {/* STEP 4: Result */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Success Header */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-4 bg-[#00ff88] rounded-full border-2 border-black flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-black" strokeWidth={2.5} />
                </motion.div>
                <h2 className="text-3xl font-bold text-black mb-2">Importação Concluída!</h2>
                <p className="text-gray-600 font-medium">
                  Processamos <span className="font-bold text-[#00ff88]">{result.total.toLocaleString()}</span> linhas do seu arquivo
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center"
                >
                  <p className="text-4xl font-bold text-[#00ff88] mb-1">{result.success}</p>
                  <p className="text-xs font-bold text-gray-600 uppercase">Importados</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center"
                >
                  <p className="text-4xl font-bold text-yellow-500 mb-1">{result.duplicates}</p>
                  <p className="text-xs font-bold text-gray-600 uppercase">Duplicatas</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center"
                >
                  <p className="text-4xl font-bold text-red-500 mb-1">{result.errors}</p>
                  <p className="text-xs font-bold text-gray-600 uppercase">Erros</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center"
                >
                  <p className="text-4xl font-bold text-black mb-1">{result.total}</p>
                  <p className="text-xs font-bold text-gray-600 uppercase">Total</p>
                </motion.div>
              </div>

              {/* Errors */}
              {result.errors > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-red-50 border-2 border-red-300 rounded-lg p-6"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" strokeWidth={2} />
                    <div>
                      <p className="font-bold text-lg text-red-600 mb-1">
                        {result.errors} erros encontrados
                      </p>
                      <p className="text-sm text-gray-600">
                        Algumas linhas não puderam ser processadas
                      </p>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto bg-white border-2 border-gray-200 rounded p-4 font-mono text-sm">
                    {result.errorDetails.slice(0, 20).map((err, i) => (
                      <div key={i} className="mb-2 pb-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-bold text-red-600">Linha {err.line}:</span>{' '}
                        <span className="text-gray-700">{err.error}</span>
                      </div>
                    ))}
                    {result.errorDetails.length > 20 && (
                      <p className="text-center text-gray-500 mt-4 text-xs">
                        ... e mais {result.errorDetails.length - 20} erros
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard/clientes')}
                  className="flex-1 px-6 py-3 bg-[#00ff88] hover:bg-[#00dd77] border-2 border-black text-black rounded font-bold transition"
                >
                  Ver Contatos
                </button>
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setResult(null);
                    setJobId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded font-bold transition"
                >
                  Nova Importação
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
