'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

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

interface ImportProgressProps {
  jobId: string;
  onComplete: (result: ImportResult) => void;
  onError: (error: string) => void;
}

export function ImportProgress({ jobId, onComplete, onError }: ImportProgressProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'active' | 'completed' | 'failed'>('active');
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts/import/${jobId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar status da importação');
        }

        const data = await response.json();

        setProgress(data.progress || 0);
        setStatus(data.state);

        if (data.state === 'completed') {
          clearInterval(interval);
          onComplete(data.result);
        } else if (data.state === 'failed') {
          clearInterval(interval);
          onError(data.error || 'Erro desconhecido');
        }

        // Calcular ETA aproximado (se tiver progresso)
        if (data.progress > 0 && data.progress < 100) {
          const estimatedTotal = (Date.now() - data.startTime) / (data.progress / 100);
          const remaining = estimatedTotal - (Date.now() - data.startTime);
          setEta(Math.ceil(remaining / 1000)); // segundos
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('Erro ao buscar status:', error);
        clearInterval(interval);
        onError(errorMessage);
      }
    };

    // Poll a cada 2 segundos
    const interval = setInterval(pollStatus, 2000);
    pollStatus(); // Primeira chamada imediata

    return () => clearInterval(interval);
  }, [jobId, onComplete, onError]);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-4 border-black rounded-xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Icon */}
          <div className="relative">
            {status === 'active' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="p-6 bg-[#00ff88] rounded-full border-4 border-black"
              >
                <Loader2 className="w-16 h-16 text-black" />
              </motion.div>
            )}
            {status === 'completed' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="p-6 bg-[#00ff88] rounded-full border-4 border-black"
              >
                <CheckCircle className="w-16 h-16 text-black" />
              </motion.div>
            )}
            {status === 'failed' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="p-6 bg-[#ff3366] rounded-full border-4 border-black"
              >
                <XCircle className="w-16 h-16 text-white" />
              </motion.div>
            )}
          </div>

          {/* Text */}
          <div className="text-center">
            <h3 className="text-3xl font-black mb-2">
              {status === 'active' && 'Processando importação...'}
              {status === 'completed' && 'Importação concluída!'}
              {status === 'failed' && 'Falha na importação'}
            </h3>
            <p className="text-black/60">
              {status === 'active' && 'Estamos processando seus contatos em segundo plano'}
              {status === 'completed' && 'Todos os contatos foram processados com sucesso'}
              {status === 'failed' && 'Ocorreu um erro durante o processamento'}
            </p>
          </div>

          {/* Progress Bar */}
          {status === 'active' && (
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-black/60">Progresso</span>
                <span className="text-2xl font-black">{progress}%</span>
              </div>
              <div className="h-8 bg-black/10 rounded-lg border-4 border-black overflow-hidden">
                <motion.div
                  className="h-full bg-[#00ff88]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* ETA */}
          {status === 'active' && eta !== null && (
            <div className="flex items-center gap-2 text-black/60">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Tempo estimado: {eta > 60 ? `${Math.ceil(eta / 60)} min` : `${eta}s`}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Job Info */}
      <div className="bg-[#ffeb3b]/10 border-4 border-[#ffeb3b] rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-black/60">ID do Job:</p>
            <p className="font-mono font-bold">{jobId}</p>
          </div>
          <div>
            <p className="text-black/60">Status:</p>
            <p className="font-bold">
              {status === 'active' && '🔄 Processando'}
              {status === 'completed' && '✅ Concluído'}
              {status === 'failed' && '❌ Falhou'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-white/50 border-2 border-black/20 rounded-xl p-4">
        <p className="text-sm text-center text-black/60">
          💡 Você pode fechar esta página. O processamento continuará em segundo plano.
        </p>
      </div>
    </div>
  );
}
