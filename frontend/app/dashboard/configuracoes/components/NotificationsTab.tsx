'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SettingsCard } from './SettingsCard';
import { Mail, MessageSquare, Bell, Loader2 } from 'lucide-react';

interface NotificationPreferences {
  emailNotifications: {
    newContacts: boolean;
    automationsCompleted: boolean;
    campaignsSent: boolean;
    integrationErrors: boolean;
    systemUpdates: boolean;
    weeklyDigest: boolean;
  };
  whatsappNotifications: {
    criticalAlerts: boolean;
    taskReminders: boolean;
  };
}

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="font-medium text-black">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`
          relative w-12 h-6 border-2 border-black transition-colors
          ${checked ? 'bg-[#00ff88]' : 'bg-gray-200'}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-4 h-4 bg-black transition-transform
            ${checked ? 'translate-x-[26px]' : 'translate-x-0.5'}
          `}
        />
      </div>
    </label>
  );
}

export function NotificationsTab() {
  const { user } = useAuthStore();

  // Initialize with defaults
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: {
      newContacts: true,
      automationsCompleted: true,
      campaignsSent: true,
      integrationErrors: true,
      systemUpdates: true,
      weeklyDigest: true,
    },
    whatsappNotifications: {
      criticalAlerts: true,
      taskReminders: false,
    },
  });

  // Load user preferences on mount
  useEffect(() => {
    if (user?.emailNotifications) {
      setNotifications((prev) => ({
        ...prev,
        emailNotifications: {
          ...prev.emailNotifications,
          ...(typeof user.emailNotifications === 'string'
            ? JSON.parse(user.emailNotifications)
            : user.emailNotifications),
        },
      }));
    }

    if (user?.whatsappNotifications) {
      setNotifications((prev) => ({
        ...prev,
        whatsappNotifications: {
          ...prev.whatsappNotifications,
          ...(typeof user.whatsappNotifications === 'string'
            ? JSON.parse(user.whatsappNotifications)
            : user.whatsappNotifications),
        },
      }));
    }
  }, [user]);

  // Update notification mutation
  const { mutateAsync: updateNotifications } = useMutation({
    mutationFn: (data: NotificationPreferences) =>
      api.patch('/settings/notifications', data),
  });

  // Auto-save
  const { isSaving } = useAutoSave(notifications, updateNotifications, {
    delay: 3000,
  });

  const updateEmailNotification = (key: keyof typeof notifications.emailNotifications, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value,
      },
    }));
  };

  const updateWhatsAppNotification = (
    key: keyof typeof notifications.whatsappNotifications,
    value: boolean
  ) => {
    setNotifications((prev) => ({
      ...prev,
      whatsappNotifications: {
        ...prev.whatsappNotifications,
        [key]: value,
      },
    }));
  };

  return (
    <>
      {/* Email Notifications Card */}
      <SettingsCard title="Notificações por E-mail" icon={Mail}>
        <div className="space-y-3">
          <ToggleSwitch
            label="Novos contatos adicionados"
            checked={notifications.emailNotifications.newContacts}
            onChange={(checked) => updateEmailNotification('newContacts', checked)}
          />

          <ToggleSwitch
            label="Automações concluídas"
            checked={notifications.emailNotifications.automationsCompleted}
            onChange={(checked) =>
              updateEmailNotification('automationsCompleted', checked)
            }
          />

          <ToggleSwitch
            label="Campanhas enviadas"
            checked={notifications.emailNotifications.campaignsSent}
            onChange={(checked) =>
              updateEmailNotification('campaignsSent', checked)
            }
          />

          <ToggleSwitch
            label="Erros em integrações"
            checked={notifications.emailNotifications.integrationErrors}
            onChange={(checked) =>
              updateEmailNotification('integrationErrors', checked)
            }
          />

          <ToggleSwitch
            label="Atualizações do sistema"
            checked={notifications.emailNotifications.systemUpdates}
            onChange={(checked) =>
              updateEmailNotification('systemUpdates', checked)
            }
          />

          <div className="border-t-2 border-gray-200 pt-3 mt-3">
            <ToggleSwitch
              label="Resumo semanal (toda segunda)"
              checked={notifications.emailNotifications.weeklyDigest}
              onChange={(checked) =>
                updateEmailNotification('weeklyDigest', checked)
              }
            />
          </div>
        </div>

        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Salvando...</span>
          </div>
        )}
      </SettingsCard>

      {/* WhatsApp Notifications Card */}
      <SettingsCard title="Notificações WhatsApp" icon={MessageSquare}>
        <div className="space-y-3">
          <ToggleSwitch
            label="Alertas críticos do sistema"
            checked={notifications.whatsappNotifications.criticalAlerts}
            onChange={(checked) =>
              updateWhatsAppNotification('criticalAlerts', checked)
            }
          />

          <ToggleSwitch
            label="Lembretes de tarefas"
            checked={notifications.whatsappNotifications.taskReminders}
            onChange={(checked) =>
              updateWhatsAppNotification('taskReminders', checked)
            }
          />
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-2 font-medium">
            Número configurado:
          </p>
          <p className="text-sm font-bold text-black">
            {user?.phone || 'Nenhum número configurado'}
          </p>
        </div>
      </SettingsCard>

      {/* In-App Alerts Card */}
      <SettingsCard title="Alertas no Painel" icon={Bell}>
        <p className="text-sm text-gray-600 mb-4">
          Configurações de notificações dentro do aplicativo (em breve).
        </p>

        <div className="space-y-3 opacity-50">
          <ToggleSwitch
            label="Mostrar notificações no sino"
            checked={true}
            onChange={() => {}}
          />

          <ToggleSwitch
            label="Sons de notificação"
            checked={false}
            onChange={() => {}}
          />

          <ToggleSwitch
            label="Notificações desktop"
            checked={false}
            onChange={() => {}}
          />
        </div>

        <p className="text-xs text-gray-500 mt-4 italic">
          Funcionalidade em desenvolvimento
        </p>
      </SettingsCard>
    </>
  );
}
