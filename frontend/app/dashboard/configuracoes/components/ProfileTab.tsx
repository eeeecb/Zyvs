'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SettingsCard } from './SettingsCard';
import { User, Lock, Info, Loader2 } from 'lucide-react';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { toast } from 'sonner';

export function ProfileTab() {
  const { user, setUser } = useAuthStore();

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profile update mutation
  const { mutateAsync: updateProfile } = useMutation({
    mutationFn: (data: typeof profileData) =>
      api.patch('/settings/profile', data),
    onSuccess: (response) => {
      if (response.data.user) {
        setUser(response.data.user);
      }
    },
  });

  // Password change mutation
  const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
    mutationFn: (data: typeof passwordData) =>
      api.patch('/settings/password', data),
    onSuccess: () => {
      toast.success('✓ Senha alterada com sucesso', {
        className: 'bg-[#00ff88] text-black border-2 border-black font-bold',
      });
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error('✗ Erro ao alterar senha', {
        description: error.response?.data?.message || 'Tente novamente',
        className: 'bg-[#ff3366] text-white border-2 border-black font-bold',
      });
    },
  });

  // Auto-save for profile
  const { isSaving } = useAutoSave(profileData, updateProfile, { delay: 3000 });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword) {
      toast.error('Senha atual obrigatória', {
        className: 'bg-[#ff3366] text-white border-2 border-black font-bold',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Nova senha deve ter no mínimo 8 caracteres', {
        className: 'bg-[#ff3366] text-white border-2 border-black font-bold',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Senhas não coincidem', {
        className: 'bg-[#ff3366] text-white border-2 border-black font-bold',
      });
      return;
    }

    changePassword(passwordData);
  };

  return (
    <>
      {/* Personal Information Card */}
      <SettingsCard title="Informações Pessoais" icon={User}>
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Nome Completo
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) =>
              setProfileData({ ...profileData, name: e.target.value })
            }
            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#00ff88] font-medium"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-2 flex items-center gap-2">
            E-mail
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Este email é usado para login e notificações
              </div>
            </div>
          </label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({ ...profileData, email: e.target.value })
            }
            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#00ff88] font-medium"
            placeholder="seu@email.com"
          />
        </div>

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Salvando...</span>
          </div>
        )}
      </SettingsCard>

      {/* Change Password Card */}
      <SettingsCard title="Alterar Senha" icon={Lock}>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Senha Atual
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#00ff88] font-medium"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#00ff88] font-medium"
              placeholder="••••••••"
            />
            {passwordData.newPassword && (
              <div className="mt-2">
                <PasswordStrength password={passwordData.newPassword} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#00ff88] font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-6 py-3 bg-black text-[#00ff88] hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-bold"
          >
            {isChangingPassword && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Atualizar Senha
          </button>
        </form>
      </SettingsCard>
    </>
  );
}
