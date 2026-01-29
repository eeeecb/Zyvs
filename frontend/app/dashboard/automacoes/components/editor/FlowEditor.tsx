'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  List,
  LayoutGrid,
  Save,
  Play,
  Power,
  Loader2,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { FlowListView } from './FlowListView';
import { FlowCanvasView } from './canvas';
import { TestFlowModal } from './TestFlowModal';
import type { Flow, FlowNode, FlowEdge } from './types';

interface FlowEditorProps {
  flowId?: string;
}

export function FlowEditor({ flowId }: FlowEditorProps) {
  const router = useRouter();
  const isNew = !flowId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('list');

  // Flow data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [status, setStatus] = useState<Flow['status']>('DRAFT');
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(flowId || null);
  const [executionCount, setExecutionCount] = useState(0);

  // Test modal
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Load existing flow
  const loadFlow = useCallback(async () => {
    if (!flowId) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/flows/${flowId}`);
      const flow = response.data;

      setName(flow.name);
      setDescription(flow.description || '');
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setStatus(flow.status);
      setCurrentFlowId(flow.id);
      setExecutionCount(flow.executionCount || 0);
    } catch {
      toast.error('Erro ao carregar automação');
      router.push('/dashboard/automacoes');
    } finally {
      setLoading(false);
    }
  }, [flowId, router]);

  useEffect(() => {
    if (flowId) {
      loadFlow();
    }
  }, [flowId, loadFlow]);

  // Save flow
  async function handleSave() {
    if (!name.trim()) {
      toast.warning('Digite um nome para a automação');
      return;
    }

    try {
      setSaving(true);

      const data = {
        name,
        description: description || undefined,
        nodes,
        edges,
      };

      if (currentFlowId) {
        // Update existing
        await api.put(`/api/flows/${currentFlowId}`, data);
        toast.success('Automação salva');
      } else {
        // Create new
        const response = await api.post('/api/flows', data);
        setCurrentFlowId(response.data.id);
        // Update URL without full navigation
        window.history.replaceState(
          {},
          '',
          `/dashboard/automacoes/${response.data.id}`
        );
        toast.success('Automação criada');
      }
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao salvar'
        : 'Erro ao salvar';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  // Toggle status
  async function handleToggleStatus() {
    if (!currentFlowId) {
      toast.warning('Salve a automação primeiro');
      return;
    }

    try {
      const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/api/flows/${currentFlowId}/status`, { status: newStatus });
      setStatus(newStatus);
      toast.success(
        newStatus === 'ACTIVE' ? 'Automação ativada' : 'Automação desativada'
      );
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao alterar status'
        : 'Erro ao alterar status';
      toast.error(message);
    }
  }

  // Add node
  function handleAddNode(node: FlowNode) {
    setNodes((prev) => [...prev, node]);

    // If there's a previous node, connect them
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge: FlowEdge = {
        id: `edge_${Date.now()}`,
        source: lastNode.id,
        target: node.id,
      };
      setEdges((prev) => [...prev, newEdge]);
    }
  }

  // Update node
  function handleUpdateNode(nodeId: string, data: FlowNode['data']) {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, data } : node))
    );
  }

  // Delete node
  function handleDeleteNode(nodeId: string) {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  }

  // Reorder nodes
  function handleReorderNodes(startIndex: number, endIndex: number) {
    const result = Array.from(nodes);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setNodes(result);

    // Rebuild edges based on new order
    const newEdges: FlowEdge[] = [];
    for (let i = 0; i < result.length - 1; i++) {
      newEdges.push({
        id: `edge_${i}`,
        source: result[i].id,
        target: result[i + 1].id,
      });
    }
    setEdges(newEdges);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/automacoes')}
              className="p-2 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da automação"
                className="text-xl font-bold text-black bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                className="text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-[#00ff88] text-black'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Modo Lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('canvas')}
                className={`p-2 ${
                  viewMode === 'canvas'
                    ? 'bg-[#00ff88] text-black'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Modo Canvas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Executions Link */}
            {currentFlowId && executionCount > 0 && (
              <button
                onClick={() => router.push(`/dashboard/automacoes/${currentFlowId}/execucoes`)}
                className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm transition flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                {executionCount} execuções
              </button>
            )}

            {/* Actions */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm transition flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>

            <button
              onClick={() => {
                if (!currentFlowId) {
                  toast.warning('Salve a automação primeiro');
                  return;
                }
                setTestModalOpen(true);
              }}
              className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm transition flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Testar
            </button>

            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 font-bold text-sm transition flex items-center gap-2 ${
                status === 'ACTIVE'
                  ? 'bg-[#00ff88] text-black hover:bg-[#00dd77]'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <Power className="w-4 h-4" />
              {status === 'ACTIVE' ? 'Ativo' : 'Ativar'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className={`flex-1 min-h-0 ${viewMode === 'list' ? 'overflow-auto p-6' : 'overflow-hidden'}`}>
        {viewMode === 'list' && (
          <FlowListView
            nodes={nodes}
            edges={edges}
            onAddNode={handleAddNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onReorderNodes={handleReorderNodes}
          />
        )}
        {viewMode === 'canvas' && (
          <FlowCanvasView
            nodes={nodes}
            edges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onUpdateNode={handleUpdateNode}
          />
        )}
      </div>

      {/* Test Modal */}
      {testModalOpen && currentFlowId && (
        <TestFlowModal
          flowId={currentFlowId}
          flowName={name}
          onClose={() => setTestModalOpen(false)}
        />
      )}
    </div>
  );
}
