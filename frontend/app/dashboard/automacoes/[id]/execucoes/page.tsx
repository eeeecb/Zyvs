'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  User,
  Mail,
  Phone,
  Filter,
  Eye,
  X,
  Zap,
  MessageSquare,
  GitBranch,
  Columns3,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface ExecutionLogEntry {
  type: string;
  label?: string;
  status: 'success' | 'error';
  result?: string | Record<string, unknown>;
  timestamp?: string;
}

interface Execution {
  id: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  nodesExecuted: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  executionLog: ExecutionLogEntry[];
  contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

interface Flow {
  id: string;
  name: string;
  executionCount: number;
  successCount: number;
  errorCount: number;
}

const statusConfig = {
  RUNNING: {
    icon: Clock,
    label: 'Em execução',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  PAUSED: {
    icon: Pause,
    label: 'Pausado',
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: 'Concluído',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  FAILED: {
    icon: XCircle,
    label: 'Falhou',
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
};

const stepIcons: Record<string, typeof Zap> = {
  trigger: Zap,
  delay: Clock,
  message: MessageSquare,
  condition: GitBranch,
  kanban: Columns3,
  tag: Tag,
};

export default function ExecutionsPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;

  const [flow, setFlow] = useState<Flow | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load flow info and executions in parallel
      const [flowRes, executionsRes] = await Promise.all([
        api.get(`/api/flows/${flowId}`),
        api.get(`/api/flows/${flowId}/executions`, {
          params: { page, limit: 20 },
        }),
      ]);

      setFlow({
        id: flowRes.data.id,
        name: flowRes.data.name,
        executionCount: flowRes.data.executionCount,
        successCount: flowRes.data.successCount,
        errorCount: flowRes.data.errorCount,
      });

      setExecutions(executionsRes.data.executions);
      setTotalPages(executionsRes.data.pagination.totalPages);
    } catch {
      toast.error('Erro ao carregar execuções');
      router.push('/dashboard/automacoes');
    } finally {
      setLoading(false);
    }
  }, [flowId, page, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter executions client-side
  const filteredExecutions = executions.filter((exec) => {
    const matchesSearch =
      !search ||
      exec.contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      exec.contact.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || exec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const successRate = flow && flow.executionCount > 0
    ? Math.round((flow.successCount / flow.executionCount) * 100)
    : 0;

  const errorRate = flow && flow.executionCount > 0
    ? Math.round((flow.errorCount / flow.executionCount) * 100)
    : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/automacoes/${flowId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar para &quot;{flow?.name}&quot;</span>
        </button>

        <h1 className="text-3xl font-bold text-black">Histórico de Execuções</h1>
        <p className="text-gray-600 text-sm mt-1">{flow?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-3xl font-bold text-black">{flow?.executionCount || 0}</p>
          <p className="text-sm text-gray-600">total de execuções</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-3xl font-bold text-[#00ff88]">{successRate}%</p>
          <p className="text-sm text-gray-600">taxa de sucesso</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-3xl font-bold text-[#ff3366]">{errorRate}%</p>
          <p className="text-sm text-gray-600">taxa de falhas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          >
            <option value="ALL">Todos os status</option>
            <option value="COMPLETED">Concluídos</option>
            <option value="RUNNING">Em execução</option>
            <option value="PAUSED">Pausados</option>
            <option value="FAILED">Falhos</option>
          </select>
        </div>
      </div>

      {/* Executions List */}
      {filteredExecutions.length === 0 ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">
            Nenhuma execução encontrada
          </h3>
          <p className="text-gray-600 text-sm">
            {search || statusFilter !== 'ALL'
              ? 'Tente ajustar os filtros'
              : 'Este flow ainda não foi executado'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {filteredExecutions.map((execution, index) => {
              const config = statusConfig[execution.status];
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 hover:border-[#00ff88] p-4 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${config.bg} flex items-center justify-center`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-black">
                            {execution.contact.name || 'Sem nome'}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-bold ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{execution.nodesExecuted} passos executados</span>
                          <span>•</span>
                          <span>{formatDate(execution.startedAt)}</span>
                        </div>
                        {execution.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">
                            {execution.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedExecution(execution)}
                      className="px-3 py-1.5 text-sm font-semibold border border-gray-300 hover:border-[#00ff88] transition flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <div className="px-4 py-2 bg-[#00ff88] border border-black text-black font-bold text-sm">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Próximo
              </button>
            </div>
          )}
        </>
      )}

      {/* Execution Detail Modal */}
      <AnimatePresence>
        {selectedExecution && (
          <ExecutionDetailModal
            execution={selectedExecution}
            onClose={() => setSelectedExecution(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Execution Detail Modal Component
function ExecutionDetailModal({
  execution,
  onClose,
}: {
  execution: Execution;
  onClose: () => void;
}) {
  const config = statusConfig[execution.status];
  const StatusIcon = config.icon;

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR');
  }

  function getDuration() {
    if (!execution.completedAt) return 'Em andamento';

    const start = new Date(execution.startedAt).getTime();
    const end = new Date(execution.completedAt).getTime();
    const diffMs = end - start;

    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    if (days > 0) return `${days} dias, ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  }

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
        <div className="bg-white w-full max-w-2xl border border-gray-300 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-black">
              Execução #{execution.id.slice(-6)}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Contact Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="font-bold text-black">{execution.contact.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {execution.contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {execution.contact.email}
                    </span>
                  )}
                  {execution.contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {execution.contact.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Times */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  <span className={`font-bold ${config.color}`}>{config.label}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Duração</p>
                <p className="font-bold text-black">{getDuration()}</p>
              </div>
              <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Início</p>
                <p className="font-semibold text-black text-sm">
                  {formatDateTime(execution.startedAt)}
                </p>
              </div>
              <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Fim</p>
                <p className="font-semibold text-black text-sm">
                  {execution.completedAt
                    ? formatDateTime(execution.completedAt)
                    : '--'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {execution.errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 mb-6">
                <p className="text-sm font-semibold text-red-800 mb-1">Erro:</p>
                <p className="text-sm text-red-700">{execution.errorMessage}</p>
              </div>
            )}

            {/* Execution Timeline */}
            <div className="border border-gray-200">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <p className="font-bold text-black text-sm">
                  Timeline de Execução
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {execution.executionLog && execution.executionLog.length > 0 ? (
                  execution.executionLog.map((log: ExecutionLogEntry, index: number) => {
                    const Icon = stepIcons[log.type] || Zap;
                    const isSuccess = log.status === 'success';

                    return (
                      <div key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 flex items-center justify-center ${
                              isSuccess ? 'bg-green-100' : 'bg-red-100'
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-gray-500" />
                              <span className="font-semibold text-black text-sm">
                                {log.label || log.type}
                              </span>
                            </div>
                            {log.result && (
                              <p className="text-xs text-gray-600">
                                {typeof log.result === 'string'
                                  ? log.result
                                  : JSON.stringify(log.result)}
                              </p>
                            )}
                            {log.timestamp && (
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(log.timestamp).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Nenhum log de execução disponível
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-sm transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
