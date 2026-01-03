'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Shield,
  Crown,
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Upload,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  userName?: string;
  userRole?: 'ADMIN' | 'LOJA';
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'LOJA';
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTION_CONFIG = {
  CREATE: { icon: Plus, color: '#00ff88', label: 'Criou' },
  UPDATE: { icon: Edit, color: '#ffeb3b', label: 'Atualizou' },
  DELETE: { icon: Trash2, color: '#ff3366', label: 'Deletou' },
  LOGIN: { icon: LogIn, color: '#00ff88', label: 'Login' },
  LOGOUT: { icon: LogOut, color: '#94a3b8', label: 'Logout' },
  EXPORT: { icon: Download, color: '#00ff88', label: 'Exportou' },
  IMPORT: { icon: Upload, color: '#ffeb3b', label: 'Importou' },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    action: '',
    tableName: '',
    startDate: '',
    endDate: '',
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.action) params.action = filters.action;
      if (filters.tableName) params.tableName = filters.tableName;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/api/admin/logs', { params });

      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
    return formatDate(date);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      tableName: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-sm">Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#ff3366] flex items-center justify-center">
            <FileText className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-black">
            Logs de Auditoria
          </h1>
        </div>
        <p className="text-gray-600 font-medium">
          Total de {pagination.total} eventos registrados
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-black">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-4 flex items-center justify-between font-bold hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" strokeWidth={2} />
            Filtros
          </div>
          <span className="text-sm text-gray-500">
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {showFilters && (
          <div className="p-6 border-t-2 border-black bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Action Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ação
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => {
                    setFilters({ ...filters, action: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border-2 border-black font-medium focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="">Todas</option>
                  <option value="CREATE">Criar</option>
                  <option value="UPDATE">Atualizar</option>
                  <option value="DELETE">Deletar</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="EXPORT">Exportar</option>
                  <option value="IMPORT">Importar</option>
                </select>
              </div>

              {/* Table Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tabela
                </label>
                <input
                  type="text"
                  placeholder="Ex: users, contacts..."
                  value={filters.tableName}
                  onChange={(e) => {
                    setFilters({ ...filters, tableName: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border-2 border-black font-medium focus:outline-none focus:border-[#00ff88]"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border-2 border-black font-medium focus:outline-none focus:border-[#00ff88]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters({ ...filters, endDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border-2 border-black font-medium focus:outline-none focus:border-[#00ff88]"
                />
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-bold border-2 border-black transition text-sm"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Logs Timeline */}
      <div className="space-y-3">
        {logs.map((log, index) => {
          const actionConfig = ACTION_CONFIG[log.action];
          const ActionIcon = actionConfig.icon;
          const RoleIcon = log.user?.role === 'ADMIN' ? Crown : Shield;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
            >
              <div className="p-4 flex items-start gap-4">
                {/* Timeline Dot */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 flex items-center justify-center border-2 border-black"
                    style={{ backgroundColor: actionConfig.color }}
                  >
                    <ActionIcon className="w-5 h-5 text-black" strokeWidth={2.5} />
                  </div>
                  {index < logs.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 text-xs font-bold text-black border border-black"
                          style={{ backgroundColor: actionConfig.color }}
                        >
                          {actionConfig.label.toUpperCase()}
                        </span>
                        <span className="text-sm font-bold text-gray-700">
                          {log.tableName}
                        </span>
                      </div>

                      {log.user && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <RoleIcon
                              className="w-3 h-3"
                              strokeWidth={2}
                              style={{
                                color: log.user.role === 'ADMIN' ? '#ff3366' : '#00ff88',
                              }}
                            />
                            <span className="font-bold text-black">
                              {log.user.name}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            ({log.user.email})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      <span>{getTimeAgo(log.createdAt)}</span>
                    </div>
                  </div>

                  {/* Changed Fields */}
                  {log.changedFields && log.changedFields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {log.changedFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-700"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* IP & User Agent */}
                  {(log.ipAddress || log.userAgent) && (
                    <div className="text-xs text-gray-500 space-y-1">
                      {log.ipAddress && (
                        <div>IP: {log.ipAddress}</div>
                      )}
                      {log.userAgent && (
                        <div className="truncate">
                          User Agent: {log.userAgent}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {selectedLog?.id === log.id && (log.oldData || log.newData) && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-3">
                      {log.oldData && (
                        <div>
                          <p className="text-xs font-bold text-gray-700 uppercase mb-2">
                            Dados Anteriores
                          </p>
                          <pre className="bg-gray-100 border-2 border-gray-300 p-3 text-xs overflow-auto max-h-40">
                            {JSON.stringify(log.oldData, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.newData && (
                        <div>
                          <p className="text-xs font-bold text-gray-700 uppercase mb-2">
                            Novos Dados
                          </p>
                          <pre className="bg-gray-100 border-2 border-gray-300 p-3 text-xs overflow-auto max-h-40">
                            {JSON.stringify(log.newData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white border-2 border-black p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Página {pagination.page} de {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 border-2 border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                Anterior
              </button>

              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border-2 border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition flex items-center gap-2"
              >
                Próxima
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="bg-white border-2 border-black p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" strokeWidth={2} />
          <h3 className="text-xl font-bold text-black mb-2">
            Nenhum log encontrado
          </h3>
          <p className="text-gray-600">
            {filters.action || filters.tableName || filters.startDate || filters.endDate
              ? 'Tente ajustar os filtros'
              : 'Não há logs de auditoria registrados'}
          </p>
        </div>
      )}
    </div>
  );
}
