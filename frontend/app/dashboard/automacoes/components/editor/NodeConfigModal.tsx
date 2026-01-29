'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, Send, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  FlowNode,
  NodeData,
  TriggerConfig,
  DelayConfig,
  MessageConfig,
  ConditionConfig,
  KanbanConfig,
  TagConfig,
} from './types';

interface NodeConfigModalProps {
  node: FlowNode;
  onSave: (data: NodeData) => void;
  onClose: () => void;
}

export function NodeConfigModal({ node, onSave, onClose }: NodeConfigModalProps) {
  const [data, setData] = useState<NodeData>(node.data);

  // For selects
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [columns, setColumns] = useState<Array<{ id: string; name: string }>>([]);

  // Load tags and columns for selects
  useEffect(() => {
    async function loadOptions() {
      try {
        const [tagsRes, columnsRes] = await Promise.all([
          api.get('/api/tags'),
          api.get('/api/kanban/columns').catch(() => ({ data: { columns: [] } })),
        ]);
        setTags(tagsRes.data.tags || []);
        setColumns(columnsRes.data.columns || []);
      } catch {
        // Ignore errors, options will be empty
      }
    }
    loadOptions();
  }, []);

  function handleSave() {
    onSave(data);
  }

  function updateConfig<T extends FlowNode['data']['config']>(updates: Partial<T>) {
    setData((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates } as T,
    }));
  }

  function renderConfigForm() {
    switch (node.type) {
      case 'trigger':
        return <TriggerConfigForm config={data.config as TriggerConfig} onChange={updateConfig} tags={tags} />;
      case 'delay':
        return <DelayConfigForm config={data.config as DelayConfig} onChange={updateConfig} />;
      case 'message':
        return <MessageConfigForm config={data.config as MessageConfig} onChange={updateConfig} />;
      case 'condition':
        return <ConditionConfigForm config={data.config as ConditionConfig} onChange={updateConfig} tags={tags} />;
      case 'kanban':
        return <KanbanConfigForm config={data.config as KanbanConfig} onChange={updateConfig} columns={columns} />;
      case 'tag':
        return <TagConfigForm config={data.config as TagConfig} onChange={updateConfig} tags={tags} />;
      default:
        return null;
    }
  }

  const titles: Record<string, string> = {
    trigger: 'Configurar Gatilho',
    delay: 'Configurar Tempo de Espera',
    message: 'Configurar Mensagem',
    condition: 'Configurar Condição',
    kanban: 'Configurar Pipeline',
    tag: 'Configurar Tag',
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-black">
              {titles[node.type] || 'Configurar'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">{renderConfigForm()}</div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 font-semibold text-sm transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-sm transition"
            >
              Salvar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Trigger Config Form
function TriggerConfigForm({
  config,
  onChange,
  tags,
}: {
  config: TriggerConfig;
  onChange: (updates: Partial<TriggerConfig>) => void;
  tags: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Quando executar
        </label>
        <select
          value={config.triggerType}
          onChange={(e) => onChange({ triggerType: e.target.value as TriggerConfig['triggerType'] })}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
        >
          <option value="new_contact">Novo contato adicionado</option>
          <option value="tag_added">Tag adicionada ao contato</option>
          <option value="tag_removed">Tag removida do contato</option>
          <option value="date_field">Data específica (aniversário, etc)</option>
        </select>
      </div>

      {(config.triggerType === 'tag_added' || config.triggerType === 'tag_removed') && (
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Tag
          </label>
          <select
            value={config.tagId || ''}
            onChange={(e) => onChange({ tagId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          >
            <option value="">Selecione uma tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {config.triggerType === 'date_field' && (
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Campo de data
          </label>
          <select
            value={config.dateField || ''}
            onChange={(e) => onChange({ dateField: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          >
            <option value="">Selecione um campo</option>
            <option value="birthdate">Data de nascimento</option>
            <option value="createdAt">Data de cadastro</option>
          </select>
        </div>
      )}
    </div>
  );
}

// Delay Config Form
function DelayConfigForm({
  config,
  onChange,
}: {
  config: DelayConfig;
  onChange: (updates: Partial<DelayConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Tempo de espera
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min="1"
            value={config.value}
            onChange={(e) => onChange({ value: Number(e.target.value) })}
            className="w-24 px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          />
          <select
            value={config.unit}
            onChange={(e) => onChange({ unit: e.target.value as DelayConfig['unit'] })}
            className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          >
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Message Config Form
function MessageConfigForm({
  config,
  onChange,
}: {
  config: MessageConfig;
  onChange: (updates: Partial<MessageConfig>) => void;
}) {
  const channelOptions = [
    { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: '#25D366', enabled: true },
    { value: 'TELEGRAM', label: 'Telegram', icon: Send, color: '#0088cc', enabled: false, tooltip: 'Em breve' },
    { value: 'SMS', label: 'SMS', icon: Phone, color: '#8b5cf6', enabled: false, tooltip: 'Indisponível no momento' },
  ];

  const variables = [
    { value: '{{nome}}', label: 'Nome' },
    { value: '{{email}}', label: 'Email' },
    { value: '{{telefone}}', label: 'Telefone' },
  ];

  function insertVariable(variable: string) {
    onChange({ content: config.content + variable });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Canal de envio
        </label>
        <div className="flex gap-2">
          {channelOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = config.channel === option.value;
            const isDisabled = !option.enabled;

            return (
              <div key={option.value} className="relative group">
                <button
                  type="button"
                  onClick={() => option.enabled && onChange({ channel: option.value as MessageConfig['channel'] })}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-3 py-2 border-2 font-semibold text-sm transition ${
                    isDisabled
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-[#00ff88] bg-[#00ff88]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ color: isDisabled ? '#9ca3af' : option.color }} />
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

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Mensagem
        </label>
        <textarea
          value={config.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm resize-none"
          rows={5}
          placeholder="Digite sua mensagem..."
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">Variáveis:</span>
          {variables.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => insertVariable(v.value)}
              className="px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            >
              {v.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Condition Config Form
function ConditionConfigForm({
  config,
  onChange,
  tags,
}: {
  config: ConditionConfig;
  onChange: (updates: Partial<ConditionConfig>) => void;
  tags: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Campo a verificar
        </label>
        <select
          value={config.field}
          onChange={(e) => onChange({ field: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
        >
          <option value="name">Nome</option>
          <option value="email">Email</option>
          <option value="phone">Telefone</option>
          <option value="status">Status</option>
          <option value="tag">Tag</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Operador
        </label>
        <select
          value={config.operator}
          onChange={(e) => onChange({ operator: e.target.value as ConditionConfig['operator'] })}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
        >
          <option value="equals">É igual a</option>
          <option value="not_equals">É diferente de</option>
          <option value="contains">Contém</option>
          <option value="has_tag">Tem a tag</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Valor
        </label>
        {config.operator === 'has_tag' ? (
          <select
            value={config.value}
            onChange={(e) => onChange({ value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          >
            <option value="">Selecione uma tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={config.value}
            onChange={(e) => onChange({ value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
            placeholder="Valor para comparar"
          />
        )}
      </div>
    </div>
  );
}

// Kanban Config Form
function KanbanConfigForm({
  config,
  onChange,
  columns,
}: {
  config: KanbanConfig;
  onChange: (updates: Partial<KanbanConfig>) => void;
  columns: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Mover para coluna
        </label>
        <select
          value={config.columnId}
          onChange={(e) => onChange({ columnId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
        >
          <option value="">Selecione uma coluna</option>
          {columns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
        {columns.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Nenhuma coluna de pipeline encontrada. Configure o pipeline primeiro.
          </p>
        )}
      </div>
    </div>
  );
}

// Tag Config Form
function TagConfigForm({
  config,
  onChange,
  tags,
}: {
  config: TagConfig;
  onChange: (updates: Partial<TagConfig>) => void;
  tags: Array<{ id: string; name: string; color: string }>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Ação
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange({ action: 'add' })}
            className={`flex-1 px-4 py-2 border-2 font-semibold text-sm transition ${
              config.action === 'add'
                ? 'border-[#00ff88] bg-[#00ff88]/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Adicionar Tag
          </button>
          <button
            type="button"
            onClick={() => onChange({ action: 'remove' })}
            className={`flex-1 px-4 py-2 border-2 font-semibold text-sm transition ${
              config.action === 'remove'
                ? 'border-[#ff3366] bg-[#ff3366]/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Remover Tag
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Tag
        </label>
        <select
          value={config.tagId}
          onChange={(e) => onChange({ tagId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
        >
          <option value="">Selecione uma tag</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
