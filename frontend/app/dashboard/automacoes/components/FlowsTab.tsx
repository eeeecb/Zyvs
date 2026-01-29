'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Zap,
  Loader2,
  Play,
  Pause,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface Flow {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  executionCount: number;
  successCount: number;
  successRate: number | null;
  lastExecution: string | null;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export function FlowsTab() {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const loadFlows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/flows', {
        params: { page, limit: 20, search },
      });
      setFlows(response.data.flows);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar flows:', error);
      toast.error('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  // Close action menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-action-menu]')) {
        setActionMenuOpen(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function handleToggleStatus(flow: Flow) {
    try {
      const newStatus = flow.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/api/flows/${flow.id}/status`, { status: newStatus });
      toast.success(
        newStatus === 'ACTIVE' ? 'Automação ativada' : 'Automação desativada'
      );
      loadFlows();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao alterar status';
      toast.error(message);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await api.post(`/api/flows/${id}/duplicate`);
      toast.success('Automação duplicada com sucesso');
      loadFlows();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao duplicar';
      toast.error(message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) return;

    try {
      await api.delete(`/api/flows/${id}`);
      toast.success('Automação excluída com sucesso');
      loadFlows();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao excluir';
      toast.error(message);
    }
  }

  function getStatusBadge(status: Flow['status']) {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-[#00ff88] text-black">
            <CheckCircle2 className="w-3 h-3" />
            ATIVO
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700">
            <Pause className="w-3 h-3" />
            INATIVO
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3" />
            RASCUNHO
          </span>
        );
    }
  }

  function formatLastExecution(date: string | null) {
    if (!date) return 'Nunca executado';

    const now = new Date();
    const execDate = new Date(date);
    const diffMs = now.getTime() - execDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays} dias`;
    return execDate.toLocaleDateString('pt-BR');
  }

  return (
    <div>
      {/* Header with Search and New Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar automações..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          />
        </div>

        <button
          onClick={() => router.push('/dashboard/automacoes/novo')}
          className="px-4 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition flex items-center gap-2 border border-black/10"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Novo Flow
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : flows.length === 0 ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">
            {search ? 'Nenhuma automação encontrada' : 'Nenhuma automação criada ainda'}
          </h3>
          <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">
            {search
              ? 'Tente buscar com outros termos'
              : 'Crie seu primeiro flow para automatizar tarefas como boas-vindas, follow-ups e lembretes.'}
          </p>
          {!search && (
            <button
              onClick={() => router.push('/dashboard/automacoes/novo')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Criar Primeiro Flow
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Flows List */}
          <div className="space-y-3 mb-6">
            {flows.map((flow, index) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 hover:border-[#00ff88] p-4 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Title and Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          flow.status === 'ACTIVE'
                            ? 'bg-[#00ff88]'
                            : flow.status === 'DRAFT'
                            ? 'bg-yellow-400'
                            : 'bg-gray-400'
                        }`}
                      />
                      <h3
                        onClick={() => router.push(`/dashboard/automacoes/${flow.id}`)}
                        className="text-lg font-semibold text-black hover:text-[#00cc6a] cursor-pointer truncate"
                      >
                        {flow.name}
                      </h3>
                      {getStatusBadge(flow.status)}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      {flow.description || 'Sem descrição'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <button
                        onClick={() => router.push(`/dashboard/automacoes/${flow.id}/execucoes`)}
                        className="flex items-center gap-1 hover:text-[#00cc6a] transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {flow.executionCount} execuções
                      </button>
                      {flow.successRate !== null && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {flow.successRate}% sucesso
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Última: {formatLastExecution(flow.lastExecution)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/dashboard/automacoes/${flow.id}`)}
                      className="px-3 py-1.5 text-sm font-semibold border border-gray-300 hover:border-[#00ff88] transition"
                    >
                      Editar
                    </button>

                    <div className="relative" data-action-menu>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpen(actionMenuOpen === flow.id ? null : flow.id);
                        }}
                        className="p-2 hover:bg-gray-100 transition"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>

                      {actionMenuOpen === flow.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 shadow-lg z-10"
                        >
                          <button
                            onClick={() => {
                              handleToggleStatus(flow);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            {flow.status === 'ACTIVE' ? (
                              <>
                                <Pause className="w-4 h-4" /> Desativar
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" /> Ativar
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              handleDuplicate(flow.id);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" /> Duplicar
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(flow.id);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 transition"
              >
                Anterior
              </button>
              <div className="px-4 py-2 bg-[#00ff88] border border-black text-black font-bold text-sm">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 transition"
              >
                Próximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
