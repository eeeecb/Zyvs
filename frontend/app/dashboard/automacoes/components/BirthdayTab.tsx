'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Cake,
  Clock,
  MessageSquare,
  Send,
  Phone,
  Loader2,
  Save,
  Calendar,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface BirthdayConfig {
  id: string;
  isEnabled: boolean;
  template: string;
  channel: 'WHATSAPP' | 'TELEGRAM' | 'SMS';
  sendAtHour: number;
  totalSent: number;
  lastSentAt: string | null;
}

interface UpcomingBirthday {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthdate: string;
  daysUntil: number;
}

const channelOptions = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, enabled: true },
  { value: 'TELEGRAM', label: 'Telegram', icon: Send, enabled: false, tooltip: 'Em breve' },
  { value: 'SMS', label: 'SMS', icon: Phone, enabled: false, tooltip: 'Indisponível no momento' },
];

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00`,
}));

const variableButtons = [
  { value: '{{nome}}', label: 'Nome' },
  { value: '{{email}}', label: 'Email' },
  { value: '{{telefone}}', label: 'Telefone' },
];

export function BirthdayTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BirthdayConfig | null>(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const [configRes, upcomingRes] = await Promise.all([
        api.get('/api/birthday-automation'),
        api.get('/api/birthday-automation/upcoming'),
      ]);
      setConfig(configRes.data);
      setUpcomingBirthdays(upcomingRes.data.contacts || []);
    } catch (error: unknown) {
      // If no config exists, create default
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        setConfig({
          id: '',
          isEnabled: false,
          template:
            'Feliz Aniversário, {{nome}}!\n\nNeste dia especial, preparamos um presente para você: 15% de desconto em qualquer compra!\n\nUse o cupom: ANIVER15\n\nVálido por 7 dias. Aproveite!',
          channel: 'WHATSAPP',
          sendAtHour: 9,
          totalSent: 0,
          lastSentAt: null,
        });
        setUpcomingBirthdays([]);
      } else {
        toast.error('Erro ao carregar configurações');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function handleSave() {
    if (!config) return;

    try {
      setSaving(true);
      await api.put('/api/birthday-automation', {
        isEnabled: config.isEnabled,
        template: config.template,
        channel: config.channel,
        sendAtHour: config.sendAtHour,
      });
      toast.success('Configurações salvas com sucesso');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  function insertVariable(variable: string) {
    if (!config) return;
    setConfig({
      ...config,
      template: config.template + variable,
    });
  }

  function formatBirthdayDate(dateStr: string, daysUntil: number) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    if (daysUntil === 0) return 'Hoje';
    if (daysUntil === 1) return 'Amanhã';
    return `${day}/${month} (${daysUntil} dias)`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6">
      {/* Main Configuration Card */}
      <div className="bg-white border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 flex items-center justify-center">
              <Cake className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black">
                Mensagem de Aniversário
              </h2>
              <p className="text-sm text-gray-600">
                Envie mensagens automáticas no aniversário dos seus clientes
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setConfig({ ...config, isEnabled: !config.isEnabled })}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              config.isEnabled ? 'bg-[#00ff88]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                config.isEnabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-6">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Canal de envio
            </label>
            <div className="flex gap-3">
              {channelOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = config.channel === option.value;
                const isDisabled = !option.enabled;

                return (
                  <div key={option.value} className="relative group">
                    <button
                      onClick={() =>
                        option.enabled && setConfig({ ...config, channel: option.value as BirthdayConfig['channel'] })
                      }
                      disabled={isDisabled}
                      className={`flex items-center gap-2 px-4 py-2.5 border-2 font-semibold text-sm transition ${
                        isDisabled
                          ? 'border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-[#00ff88] bg-[#00ff88]/10 text-black'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                    {isDisabled && option.tooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {option.tooltip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Send Time */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Horário de envio
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <select
                value={config.sendAtHour}
                onChange={(e) =>
                  setConfig({ ...config, sendAtHour: Number(e.target.value) })
                }
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              >
                {hourOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                Enviar às {config.sendAtHour}h da manhã
              </span>
            </div>
          </div>

          {/* Message Template */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Mensagem
            </label>
            <textarea
              value={config.template}
              onChange={(e) => setConfig({ ...config, template: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm resize-none"
              rows={6}
              placeholder="Digite a mensagem de aniversário..."
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Variáveis:</span>
              {variableButtons.map((v) => (
                <button
                  key={v.value}
                  onClick={() => insertVariable(v.value)}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                >
                  {v.value}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="font-bold text-black mb-4">Estatísticas</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 text-center">
            <p className="text-2xl font-bold text-black">{config.totalSent}</p>
            <p className="text-sm text-gray-600">enviadas este ano</p>
          </div>
          <div className="p-4 bg-gray-50 text-center">
            <p className="text-2xl font-bold text-[#00ff88]">98%</p>
            <p className="text-sm text-gray-600">sucesso</p>
          </div>
          <div className="p-4 bg-gray-50 text-center">
            <p className="text-2xl font-bold text-black">
              {config.lastSentAt
                ? new Date(config.lastSentAt).toLocaleDateString('pt-BR')
                : '--'}
            </p>
            <p className="text-sm text-gray-600">último envio</p>
          </div>
        </div>
      </div>

      {/* Upcoming Birthdays */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-black">Próximos Aniversários (7 dias)</h3>
          </div>
          <span className="text-sm text-gray-500">
            {upcomingBirthdays.length} contatos
          </span>
        </div>

        {upcomingBirthdays.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum aniversário nos próximos 7 dias</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingBirthdays.slice(0, 5).map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-black">{contact.name}</p>
                  <p className="text-xs text-gray-500">
                    {contact.email || contact.phone || 'Sem contato'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {contact.daysUntil <= 1 && (
                    <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      contact.daysUntil === 0
                        ? 'text-[#00ff88]'
                        : contact.daysUntil === 1
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatBirthdayDate(contact.birthdate, contact.daysUntil)}
                  </span>
                </div>
              </div>
            ))}

            {upcomingBirthdays.length > 5 && (
              <button className="w-full py-2 text-sm text-[#00cc6a] hover:text-[#00aa55] font-semibold">
                Ver todos os aniversários →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
