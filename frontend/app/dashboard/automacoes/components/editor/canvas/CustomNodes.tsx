'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import {
  Zap,
  Clock,
  MessageSquare,
  GitBranch,
  Columns3,
  Tag,
  Trash2,
} from 'lucide-react';
import type {
  NodeType,
  TriggerConfig,
  DelayConfig,
  MessageConfig,
  ConditionConfig,
} from '../types';

// Node colors from design system
const nodeColors: Record<NodeType, string> = {
  trigger: '#00ff88',
  delay: '#ffeb3b',
  message: '#25D366',
  condition: '#f97316',
  kanban: '#ff3366',
  tag: '#6b7280',
};

const nodeIcons: Record<NodeType, typeof Zap> = {
  trigger: Zap,
  delay: Clock,
  message: MessageSquare,
  condition: GitBranch,
  kanban: Columns3,
  tag: Tag,
};

const nodeLabels: Record<NodeType, string> = {
  trigger: 'Gatilho',
  delay: 'Aguardar',
  message: 'Mensagem',
  condition: 'Condição',
  kanban: 'Pipeline',
  tag: 'Tag',
};

// Base node wrapper component
interface BaseNodeProps {
  type: NodeType;
  nodeId: string;
  label?: string;
  summary?: string;
  selected?: boolean;
  hasSourceHandle?: boolean;
  hasTargetHandle?: boolean;
  sourceHandles?: { id: string; label?: string }[];
}

function BaseNode({
  type,
  nodeId,
  label,
  summary,
  selected,
  hasSourceHandle = true,
  hasTargetHandle = true,
  sourceHandles,
}: BaseNodeProps) {
  const Icon = nodeIcons[type];
  const color = nodeColors[type];
  const defaultLabel = nodeLabels[type];
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't allow deleting trigger node
    if (type === 'trigger') return;

    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  return (
    <div
      className={`
        min-w-[160px] max-w-[200px] bg-white border-2 shadow-md transition-shadow relative group
        ${selected ? 'shadow-lg ring-2 ring-blue-400' : 'hover:shadow-lg'}
      `}
      style={{ borderColor: color }}
    >
      {/* Delete button - shows when selected (except for trigger) */}
      {selected && type !== 'trigger' && (
        <button
          onClick={handleDelete}
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
          title="Excluir node"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {/* Target handle (input) */}
      {hasTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-wide truncate" style={{ color }}>
          {defaultLabel}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        {label && (
          <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        )}
        {summary && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{summary}</p>
        )}
        {!label && !summary && (
          <p className="text-xs text-gray-400 italic">Clique para configurar</p>
        )}
      </div>

      {/* Source handles (outputs) */}
      {hasSourceHandle && !sourceHandles && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* Multiple source handles for condition nodes */}
      {sourceHandles && (
        <div className="relative h-4">
          {sourceHandles.map((handle, index) => (
            <Handle
              key={handle.id}
              type="source"
              position={Position.Bottom}
              id={handle.id}
              className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
              style={{
                left: index === 0 ? '25%' : '75%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Trigger Node
export const TriggerNode = memo(({ id, data, selected }: NodeProps) => {
  const config = data.config as TriggerConfig | undefined;

  const getSummary = () => {
    if (!config) return undefined;
    switch (config.triggerType) {
      case 'new_contact':
        return 'Novo contato';
      case 'tag_added':
        return 'Tag adicionada';
      case 'tag_removed':
        return 'Tag removida';
      case 'date_field':
        return 'Data específica';
      default:
        return undefined;
    }
  };

  return (
    <BaseNode
      type="trigger"
      nodeId={id}
      label={data.label as string}
      summary={getSummary()}
      selected={selected}
      hasTargetHandle={false}
    />
  );
});
TriggerNode.displayName = 'TriggerNode';

// Delay Node
export const DelayNode = memo(({ id, data, selected }: NodeProps) => {
  const config = data.config as DelayConfig | undefined;

  const getSummary = () => {
    if (!config) return undefined;
    const unitLabels: Record<string, string> = {
      minutes: config.value === 1 ? 'minuto' : 'minutos',
      hours: config.value === 1 ? 'hora' : 'horas',
      days: config.value === 1 ? 'dia' : 'dias',
    };
    return `${config.value} ${unitLabels[config.unit]}`;
  };

  return (
    <BaseNode
      type="delay"
      nodeId={id}
      label={data.label as string}
      summary={getSummary()}
      selected={selected}
    />
  );
});
DelayNode.displayName = 'DelayNode';

// Message Node
export const MessageNode = memo(({ id, data, selected }: NodeProps) => {
  const config = data.config as MessageConfig | undefined;

  const getSummary = () => {
    if (!config?.content) return undefined;
    const preview =
      config.content.length > 30 ? config.content.slice(0, 30) + '...' : config.content;
    const channelLabel = config.channel === 'WHATSAPP' ? 'WhatsApp' : config.channel;
    return `${channelLabel}: "${preview}"`;
  };

  return (
    <BaseNode
      type="message"
      nodeId={id}
      label={data.label as string}
      summary={getSummary()}
      selected={selected}
    />
  );
});
MessageNode.displayName = 'MessageNode';

// Condition Node (has two outputs: yes/no)
export const ConditionNode = memo(({ id, data, selected }: NodeProps) => {
  const config = data.config as ConditionConfig | undefined;

  const getSummary = () => {
    if (!config?.value) return undefined;
    const opLabels: Record<string, string> = {
      equals: '=',
      not_equals: '≠',
      contains: 'contém',
      has_tag: 'tem tag',
    };
    return `${config.field} ${opLabels[config.operator]} "${config.value}"`;
  };

  return (
    <div className="relative">
      <BaseNode
        type="condition"
        nodeId={id}
        label={data.label as string}
        summary={getSummary()}
        selected={selected}
        hasSourceHandle={false}
        sourceHandles={[
          { id: 'yes', label: 'Sim' },
          { id: 'no', label: 'Não' },
        ]}
      />
      {/* Labels for condition outputs */}
      <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-4 text-[10px] text-gray-500 font-medium">
        <span>Sim</span>
        <span>Não</span>
      </div>
    </div>
  );
});
ConditionNode.displayName = 'ConditionNode';

// Kanban Node
export const KanbanNode = memo(({ id, data, selected }: NodeProps) => {
  return (
    <BaseNode
      type="kanban"
      nodeId={id}
      label={data.label as string}
      summary="Mover para coluna"
      selected={selected}
    />
  );
});
KanbanNode.displayName = 'KanbanNode';

// Tag Node
export const TagNode = memo(({ id, data, selected }: NodeProps) => {
  return (
    <BaseNode
      type="tag"
      nodeId={id}
      label={data.label as string}
      summary="Adicionar/remover tag"
      selected={selected}
    />
  );
});
TagNode.displayName = 'TagNode';

// Export nodeTypes for React Flow
export const nodeTypes = {
  trigger: TriggerNode,
  delay: DelayNode,
  message: MessageNode,
  condition: ConditionNode,
  kanban: KanbanNode,
  tag: TagNode,
};
