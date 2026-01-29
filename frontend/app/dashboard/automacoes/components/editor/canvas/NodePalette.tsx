'use client';

import {
  Zap,
  Clock,
  MessageSquare,
  GitBranch,
  Columns3,
  Tag,
} from 'lucide-react';
import type { NodeType } from '../types';

interface NodeTypeItem {
  type: NodeType;
  label: string;
  description: string;
  icon: typeof Zap;
  color: string;
}

const nodeTypeItems: NodeTypeItem[] = [
  {
    type: 'trigger',
    label: 'Gatilho',
    description: 'Inicia o flow',
    icon: Zap,
    color: '#00ff88',
  },
  {
    type: 'delay',
    label: 'Aguardar',
    description: 'Esperar tempo',
    icon: Clock,
    color: '#ffeb3b',
  },
  {
    type: 'message',
    label: 'Mensagem',
    description: 'WhatsApp/Email/SMS',
    icon: MessageSquare,
    color: '#25D366',
  },
  {
    type: 'condition',
    label: 'Condição',
    description: 'Se/Senão',
    icon: GitBranch,
    color: '#f97316',
  },
  {
    type: 'kanban',
    label: 'Pipeline',
    description: 'Mover coluna',
    icon: Columns3,
    color: '#ff3366',
  },
  {
    type: 'tag',
    label: 'Tag',
    description: 'Adicionar/remover',
    icon: Tag,
    color: '#6b7280',
  },
];

interface NodePaletteProps {
  hasTrigger: boolean;
}

export function NodePalette({ hasTrigger }: NodePaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Paleta de Nós
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Arraste para o canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {nodeTypeItems.map((item) => {
          const Icon = item.icon;
          const isDisabled = item.type === 'trigger' && hasTrigger;

          return (
            <div
              key={item.type}
              draggable={!isDisabled}
              onDragStart={(e) => !isDisabled && onDragStart(e, item.type)}
              className={`
                p-3 border-2 transition-all cursor-grab active:cursor-grabbing
                ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                }
              `}
              style={{
                borderLeftColor: isDisabled ? undefined : item.color,
                borderLeftWidth: '4px',
              }}
              title={isDisabled ? 'Já existe um gatilho no flow' : `Arrastar ${item.label}`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isDisabled ? '#9ca3af' : item.color }}
                  strokeWidth={2.5}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: isDisabled ? '#9ca3af' : item.color }}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Arraste para criar um nó
        </p>
      </div>
    </div>
  );
}
