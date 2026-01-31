'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { SettingsCard } from './SettingsCard';
import Image from 'next/image';
import {
  Shield,
  Monitor,
  Download,
  Loader2,
  X,
  AlertCircle,
  Copy,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface Session {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
}

export function PrivacyTab() {
  const { user, updateUser } = useAuthStore();
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [canCloseBackupCodes, setCanCloseBackupCodes] = useState(false);

  // Fetch active sessions
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/settings/sessions');
      return response.data.sessions;
    },
  });

  // Enable 2FA mutation
  const { mutate: enable2FA, isPending: isEnabling2FA } = useMutation({
    mutationFn: (password: string) =>
      api.post('/api/settings/2fa/enable', { password }),
    onSuccess: (response) => {
      setQrCodeImage(response.data.qrCodeImage);
      setManualSecret(response.data.secret);
      setShowQRCode(true);
      toast.success('Escaneie o QR Code com seu aplicativo autenticador');
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'Erro ao ativar 2FA');
    },
  });

  // Verify 2FA mutation
  const { mutate: verify2FA, isPending: isVerifying2FA } = useMutation({
    mutationFn: (token: string) =>
      api.post('/api/settings/2fa/verify', { token }),
    onSuccess: (response) => {
      toast.success('2FA ativado com sucesso!');
      setShowQRCode(false);
      setVerificationCode('');
      // Update user state with server response
      if (response.data.user) {
        updateUser(response.data.user);
      }
      // Show backup codes modal
      if (response.data.backupCodes) {
        setBackupCodes(response.data.backupCodes);
        setShowBackupCodes(true);
        setCanCloseBackupCodes(false);
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'Token inválido');
    },
  });

  // 5-second timer for backup codes modal
  useEffect(() => {
    if (showBackupCodes && !canCloseBackupCodes) {
      const timer = setTimeout(() => {
        setCanCloseBackupCodes(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showBackupCodes, canCloseBackupCodes]);

  // Copy all backup codes to clipboard
  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Todos os códigos copiados para a área de transferência');
  };

  // Download backup codes as .txt file
  const handleDownloadBackupCodes = () => {
    const codesText = `THUMDRA - CÓDIGOS DE BACKUP 2FA
================================
Guarde estes códigos em local seguro.
Cada código funciona apenas uma vez.
================================

${backupCodes.join('\n')}

================================
Gerado em: ${new Date().toLocaleString('pt-BR')}
`;
    const blob = new Blob([codesText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thumdra-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Arquivo baixado');
  };

  // Close backup codes modal
  const handleCloseBackupCodes = () => {
    setShowBackupCodes(false);
    setBackupCodes([]);
  };

  // Disable 2FA mutation
  const { mutate: disable2FA, isPending: isDisabling2FA } = useMutation({
    mutationFn: ({ password, token }: { password: string; token: string }) =>
      api.post('/api/settings/2fa/disable', { password, token }),
    onSuccess: (response) => {
      toast.success('2FA desativado com sucesso');
      // Update user state with server response
      if (response.data.user) {
        updateUser(response.data.user);
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'Erro ao desativar 2FA');
    },
  });

  // Revoke session mutation
  const { mutate: revokeSession } = useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(`/api/settings/sessions/${sessionId}`),
    onSuccess: () => {
      toast.success('Sessão encerrada');
      refetchSessions();
    },
    onError: () => {
      toast.error('Erro ao encerrar sessão');
    },
  });

  // Request data export mutation
  const { mutate: requestExport, isPending: isRequestingExport } = useMutation({
    mutationFn: () => api.post('/api/settings/export-data'),
    onSuccess: (response) => {
      toast.success(response.data.message);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'Erro ao solicitar exportação');
    },
  });

  const handleEnable2FA = () => {
    const password = prompt('Digite sua senha para ativar 2FA:');
    if (password) {
      enable2FA(password);
    }
  };

  const handleDisable2FA = () => {
    const password = prompt('Digite sua senha:');
    if (!password) return;

    const token = prompt('Digite o código do seu aplicativo autenticador:');
    if (!token) return;

    disable2FA({ password, token });
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffMins < 1440) return `há ${Math.floor(diffMins / 60)} horas`;
    return `há ${Math.floor(diffMins / 1440)} dias`;
  };

  return (
    <>
      {/* 2FA Card */}
      <SettingsCard title="Autenticação de Dois Fatores (2FA)" icon={Shield}>
        <div
          className={`inline-block px-3 py-1 border-2 border-black text-xs font-bold uppercase mb-4 ${
            user?.twoFactorEnabled
              ? 'bg-[#00ff88]'
              : 'bg-[#ff3366] text-white'
          }`}
        >
          Status: {user?.twoFactorEnabled ? 'Ativado' : 'Desativado'}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Adicione uma camada extra de segurança ao seu login usando um
          aplicativo autenticador como Google Authenticator ou Authy.
        </p>

        {!user?.twoFactorEnabled ? (
          <button
            onClick={handleEnable2FA}
            disabled={isEnabling2FA}
            className="px-4 py-2 bg-[#00ff88] border-2 border-black hover:bg-[#00ff88]/90 disabled:opacity-50 transition flex items-center gap-2 font-bold text-sm"
          >
            {isEnabling2FA && <Loader2 className="w-4 h-4 animate-spin" />}
            Ativar 2FA
          </button>
        ) : (
          <button
            onClick={handleDisable2FA}
            disabled={isDisabling2FA}
            className="px-4 py-2 border-2 border-black hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2 font-bold text-sm"
          >
            {isDisabling2FA && <Loader2 className="w-4 h-4 animate-spin" />}
            Desativar 2FA
          </button>
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-black p-8 max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Configure 2FA</h3>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-gray-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  1. Escaneie o QR Code com seu aplicativo autenticador
                </p>
                <div className="bg-white p-4 border-2 border-black flex justify-center">
                  {qrCodeImage && (
                    <Image
                      src={qrCodeImage}
                      alt="QR Code"
                      width={200}
                      height={200}
                      className="w-48 h-48"
                      unoptimized
                    />
                  )}
                </div>
                {manualSecret && (
                  <div className="mt-3 p-2 bg-gray-100 border-2 border-gray-300">
                    <p className="text-xs text-gray-500 mb-1">Ou digite manualmente:</p>
                    <code className="text-sm font-mono break-all">{manualSecret}</code>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  2. Digite o código de 6 dígitos
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ''))
                  }
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#00ff88] font-mono text-lg text-center"
                />
              </div>

              <button
                onClick={() => verify2FA(verificationCode)}
                disabled={verificationCode.length !== 6 || isVerifying2FA}
                className="w-full px-4 py-3 bg-[#00ff88] border-2 border-black hover:bg-[#00ff88]/90 disabled:opacity-50 transition flex items-center justify-center gap-2 font-bold"
              >
                {isVerifying2FA && <Loader2 className="w-4 h-4 animate-spin" />}
                Verificar e Ativar
              </button>
            </div>
          </div>
        )}

        {/* Backup Codes Modal */}
        {showBackupCodes && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-black p-8 max-w-lg mx-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-[#00ff88]" />
                <h3 className="text-xl font-bold">Códigos de Backup</h3>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-yellow-800 font-bold">
                  Guarde estes códigos em local seguro!
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Cada código funciona apenas uma vez. Use-os caso perca acesso ao seu aplicativo autenticador.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 p-4 bg-gray-50 border-2 border-black">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="font-mono text-sm bg-white px-3 py-2 border border-gray-300 text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleCopyBackupCodes}
                  className="flex-1 px-4 py-2 border-2 border-black hover:bg-gray-50 transition flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copiar todos
                </button>
                <button
                  onClick={handleDownloadBackupCodes}
                  className="flex-1 px-4 py-2 border-2 border-black hover:bg-gray-50 transition flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <FileDown className="w-4 h-4" />
                  Baixar .txt
                </button>
              </div>

              <button
                onClick={handleCloseBackupCodes}
                disabled={!canCloseBackupCodes}
                className="w-full px-4 py-3 bg-[#00ff88] border-2 border-black hover:bg-[#00ff88]/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-bold"
              >
                {!canCloseBackupCodes ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aguarde...
                  </>
                ) : (
                  'Concluir'
                )}
              </button>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* Active Sessions Card */}
      <SettingsCard title="Sessões Ativas" icon={Monitor}>
        <div className="space-y-3">
          {sessionsData && sessionsData.length > 0 ? (
            sessionsData.map((session: Session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-3 border-2 border-gray-200 hover:border-black transition"
              >
                <div className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-black mt-1" />
                  <div>
                    <p className="font-bold text-black">{session.device}</p>
                    <p className="text-sm text-gray-600">{session.location}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Última atividade: {formatDate(session.lastActivity)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => revokeSession(session.id)}
                  className="px-3 py-1 border-2 border-black hover:bg-gray-100 transition text-xs font-bold"
                >
                  Encerrar
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              Nenhuma sessão ativa encontrada
            </p>
          )}
        </div>
      </SettingsCard>

      {/* Data Export Card */}
      <SettingsCard title="Exportar Seus Dados" icon={Download}>
        <p className="text-sm text-gray-600 mb-4">
          Baixe uma cópia de todos os seus dados em formato JSON (LGPD
          compliance).
        </p>

        <div className="bg-gray-50 border-2 border-gray-200 p-3 mb-4">
          <p className="text-sm text-gray-700">
            <strong>Inclui:</strong> contatos, campanhas, flows, mensagens e
            configurações.
          </p>
        </div>

        <button
          onClick={() => requestExport()}
          disabled={isRequestingExport}
          className="px-4 py-2 bg-black text-[#00ff88] hover:bg-gray-900 disabled:opacity-50 transition flex items-center gap-2 font-bold text-sm"
        >
          {isRequestingExport && <Loader2 className="w-4 h-4 animate-spin" />}
          Solicitar Exportação
        </button>

        <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 border-2 border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Você receberá um e-mail com o link para download em até 24 horas.
          </p>
        </div>
      </SettingsCard>
    </>
  );
}
