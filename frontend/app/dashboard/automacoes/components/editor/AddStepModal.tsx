'use client';

import { motion } from 'framer-motion';
import {
  X,
  Zap,
  Clock,
  MessageSquare,
  GitBranch,
  Columns3,
  Tag,
} from 'lucide-react';
import type { FlowNode, NodeType } from './types';
import { generateId, getDefaultConfig } from './types';

interface StepOption {
  type: NodeType;
  label: string;
  description: string;
  icon: typeof Zap;
  color: string;
  triggerOnly?: boolean;
}

const stepOptions: StepOption[] = [
  {
    type: 'trigger',
    label: 'Gatilho',
    description: 'Inicia o flow quando algo acontece',
    icon: Zap,
    color: '#00ff88',
    triggerOnly: true,
  },
  {
    type: 'delay',
    label: 'Aguardar',
    description: 'Espera X dias/horas antes de continuar',
    icon: Clock,
    color: '#ffeb3b',
  },
  {
    type: 'message',
    label: 'Enviar WhatsApp',
    description: 'Mensagem via WhatsApp',
    icon: MessageSquare,
    color: '#25D366',
  },
  {
    type: 'condition',
    label: 'Condição',
    description: 'Se/Senão baseado em dados',
    icon: GitBranch,
    color: '#f97316',
  },
  {
    type: 'kanban',
    label: 'Mover no Pipeline',
    description: 'Mover contato de coluna',
    icon: Columns3,
    color: '#ff3366',
  },
  {
    type: 'tag',
    label: 'Adicionar Tag',
    description: 'Aplicar tag ao contato',
    icon: Tag,
    color: '#6b7280',
  },
];

interface AddStepModalProps {
  onAdd: (node: FlowNode) => void;
  onClose: () => void;
  hasTrigger: boolean;
}

export function AddStepModal({ onAdd, onClose, hasTrigger }: AddStepModalProps) {
  function handleSelect(option: StepOption) {
    const node: FlowNode = {
      id: generateId(),
      type: option.type,
      data: {
        label: option.label,
        config: getDefaultConfig(option.type),
      },
      position: { x: 0, y: 0 },
    };
    onAdd(node);
  }

  // Filter options based on whether we have a trigger
  const availableOptions = hasTrigger
    ? stepOptions.filter((o) => !o.triggerOnly)
    : stepOptions;

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
        <div className="bg-white w-full max-w-md border border-gray-300 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-black">Adicionar Passo</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Options */}
          <div className="p-4 space-y-2">
            {availableOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.type}
                  onClick={() => handleSelect(option)}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-left"
                  style={{ borderLeftColor: option.color, borderLeftWidth: '4px' }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ backgroundColor: option.color + '20' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: option.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-black">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}
