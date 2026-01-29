'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  GripVertical,
  Settings,
  Trash2,
  ArrowDown,
  Zap,
  Clock,
  MessageSquare,
  GitBranch,
  Columns3,
  Tag,
} from 'lucide-react';
import { AddStepModal } from './AddStepModal';
import { NodeConfigModal } from './NodeConfigModal';
import type {
  FlowNode,
  FlowEdge,
  NodeType,
  TriggerConfig,
  DelayConfig,
  MessageConfig,
  ConditionConfig,
} from './types';

const nodeIcons: Record<NodeType, typeof Zap> = {
  trigger: Zap,
  delay: Clock,
  message: MessageSquare,
  condition: GitBranch,
  kanban: Columns3,
  tag: Tag,
};

const nodeColors: Record<NodeType, string> = {
  trigger: '#00ff88',
  delay: '#ffeb3b',
  message: '#25D366',
  condition: '#f97316',
  kanban: '#ff3366',
  tag: '#6b7280',
};

const nodeLabels: Record<NodeType, string> = {
  trigger: 'GATILHO',
  delay: 'AGUARDAR',
  message: 'MENSAGEM',
  condition: 'CONDIÇÃO',
  kanban: 'PIPELINE',
  tag: 'TAG',
};

interface FlowListViewProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onAddNode: (node: FlowNode) => void;
  onUpdateNode: (nodeId: string, data: FlowNode['data']) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderNodes: (startIndex: number, endIndex: number) => void;
}

export function FlowListView({
  nodes,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
}: FlowListViewProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [configModalNode, setConfigModalNode] = useState<FlowNode | null>(null);

  function getNodeSummary(node: FlowNode): string {
    const config = node.data.config;

    switch (node.type) {
      case 'trigger': {
        const c = config as TriggerConfig;
        switch (c.triggerType) {
          case 'new_contact':
            return 'Quando: Novo contato adicionado';
          case 'tag_added':
            return 'Quando: Tag adicionada';
          case 'tag_removed':
            return 'Quando: Tag removida';
          case 'date_field':
            return 'Quando: Data específica';
          default:
            return 'Configurar gatilho';
        }
      }
      case 'delay': {
        const c = config as DelayConfig;
        const unitLabel = {
          minutes: c.value === 1 ? 'minuto' : 'minutos',
          hours: c.value === 1 ? 'hora' : 'horas',
          days: c.value === 1 ? 'dia' : 'dias',
        };
        return `${c.value} ${unitLabel[c.unit]}`;
      }
      case 'message': {
        const c = config as MessageConfig;
        if (!c.content) return 'Configurar mensagem';
        const preview =
          c.content.length > 50 ? c.content.slice(0, 50) + '...' : c.content;
        return `"${preview}"`;
      }
      case 'condition': {
        const c = config as ConditionConfig;
        if (!c.value) return 'Configurar condição';
        const opLabels = {
          equals: '=',
          not_equals: '≠',
          contains: 'contém',
          has_tag: 'tem tag',
        };
        return `${c.field} ${opLabels[c.operator]} "${c.value}"`;
      }
      case 'kanban':
        return node.data.label || 'Mover para coluna';
      case 'tag':
        return node.data.label || 'Configurar tag';
      default:
        return 'Configurar';
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Flow Steps */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          FLOW
        </h3>

        {nodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Adicione um gatilho para iniciar seu flow
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar Gatilho
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            <AnimatePresence>
              {nodes.map((node, index) => {
                const Icon = nodeIcons[node.type];
                const color = nodeColors[node.type];
                const label = nodeLabels[node.type];

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative"
                  >
                    {/* Node Card */}
                    <div
                      className="relative border-2 border-gray-200 hover:border-gray-300 bg-white transition-all group"
                      style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-stretch">
                        {/* Drag Handle */}
                        <div className="flex items-center px-2 bg-gray-50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              className="w-4 h-4"
                              style={{ color }}
                              strokeWidth={2.5}
                            />
                            <span
                              className="text-xs font-bold uppercase tracking-wide"
                              style={{ color }}
                            >
                              {label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {getNodeSummary(node)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfigModalNode(node)}
                            className="p-2 hover:bg-gray-100 transition"
                            title="Configurar"
                          >
                            <Settings className="w-4 h-4 text-gray-500" />
                          </button>
                          {node.type !== 'trigger' && (
                            <button
                              onClick={() => onDeleteNode(node.id)}
                              className="p-2 hover:bg-red-50 transition"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {index < nodes.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowDown className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Add Step Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-[#00ff88] text-gray-600 hover:text-black font-semibold text-sm transition"
              >
                <Plus className="w-4 h-4" />
                Adicionar Passo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Step Modal */}
      {addModalOpen && (
        <AddStepModal
          onAdd={(node) => {
            onAddNode(node);
            setAddModalOpen(false);
          }}
          onClose={() => setAddModalOpen(false)}
          hasTrigger={nodes.some((n) => n.type === 'trigger')}
        />
      )}

      {/* Node Config Modal */}
      {configModalNode && (
        <NodeConfigModal
          node={configModalNode}
          onSave={(data) => {
            onUpdateNode(configModalNode.id, data);
            setConfigModalNode(null);
          }}
          onClose={() => setConfigModalNode(null)}
        />
      )}
    </div>
  );
}
