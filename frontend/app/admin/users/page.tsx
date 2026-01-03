'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Building2,
  Shield,
  Crown,
  Zap,
  CreditCard,
  CheckCircle2,
  XCircle,
  Activity,
  MessageSquare,
  X,
  Key,
  UserCog,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'LOJA';
  plan?: string;
  planExpiry?: string;
  messagesUsedThisMonth: number;
  flowExecutionsThisMonth: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCurrentPeriodEnd?: string;
  onboardingCompleted: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  createdAt: string;
  lastLoginAt?: string;
  _count: {
    createdFlows: number;
    createdCampaigns: number;
    auditLogs: number;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined,
        },
      });

      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadUsers();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, pagination.page, loadUsers]);

  const handleUpdateRole = async (userId: string, newRole: 'ADMIN' | 'LOJA') => {
    if (!confirm(`Tem certeza que deseja ${newRole === 'ADMIN' ? 'promover' : 'rebaixar'} este usuário?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role atualizada com sucesso!');
      loadUsers();
      setSelectedUser(null);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Erro ao atualizar role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast.warning('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/api/admin/users/${selectedUser.id}/reset-password`, {
        newPassword,
      });
      toast.success('Senha resetada com sucesso!');
      setShowResetPassword(false);
      setNewPassword('');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Erro ao resetar senha');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' ? '#ff3366' : '#00ff88';
  };

  const getRoleIcon = (role: string) => {
    return role === 'ADMIN' ? Crown : Shield;
  };

  const getPlanBadgeColor = (plan?: string) => {
    if (!plan) return '#gray';
    if (plan === 'FREE') return '#94a3b8';
    if (plan.includes('TESTE')) return '#ffeb3b';
    return '#00ff88';
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTimeAgo = (date?: string) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const past = new Date(date);
    const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return '1 dia atrás';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
    return formatDate(date);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-sm">Carregando usuários...</p>
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
            <Users className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-black">
            Gerenciar Usuários
          </h1>
        </div>
        <p className="text-gray-600 font-medium">
          Total de {pagination.total} usuários cadastrados
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border-2 border-black p-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-black font-medium focus:outline-none focus:border-[#00ff88] transition"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user, index) => {
          const RoleIcon = getRoleIcon(user.role);
          const hasStripe = !!user.stripeSubscriptionId;
          const isSubscriptionActive = user.stripeCurrentPeriodEnd
            ? new Date(user.stripeCurrentPeriodEnd) > new Date()
            : false;

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              {/* Main Info */}
              <div className="p-6 border-b-2 border-black">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-black">
                          {user.name}
                        </h3>
                        <div
                          className="px-2 py-1 text-xs font-bold text-white flex items-center gap-1"
                          style={{ backgroundColor: getRoleColor(user.role) }}
                        >
                          <RoleIcon className="w-3 h-3" strokeWidth={2.5} />
                          {user.role}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" strokeWidth={2} />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {user.plan && (
                      <div
                        className="px-3 py-1 border-2 border-black font-bold text-xs text-black"
                        style={{ backgroundColor: getPlanBadgeColor(user.plan) }}
                      >
                        {user.plan}
                      </div>
                    )}

                    {hasStripe && (
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <CreditCard className="w-3 h-3" strokeWidth={2} />
                        {isSubscriptionActive ? (
                          <span className="text-green-600">Assinatura Ativa</span>
                        ) : (
                          <span className="text-gray-500">Assinatura Inativa</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs font-medium">
                      {user.onboardingCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-600" strokeWidth={2} />
                          <span className="text-green-600">Onboarding OK</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-orange-500" strokeWidth={2} />
                          <span className="text-orange-500">Onboarding Pendente</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
                {user.organization && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Building2 className="w-3 h-3" strokeWidth={2} />
                      <span className="uppercase font-bold">Organização</span>
                    </div>
                    <p className="text-sm font-bold text-black truncate">
                      {user.organization.name}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MessageSquare className="w-3 h-3" strokeWidth={2} />
                    <span className="uppercase font-bold">Mensagens (mês)</span>
                  </div>
                  <p className="text-sm font-bold text-black">
                    {user.messagesUsedThisMonth.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Zap className="w-3 h-3" strokeWidth={2} />
                    <span className="uppercase font-bold">Flows (mês)</span>
                  </div>
                  <p className="text-sm font-bold text-black">
                    {user.flowExecutionsThisMonth.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Activity className="w-3 h-3" strokeWidth={2} />
                    <span className="uppercase font-bold">Último Login</span>
                  </div>
                  <p className="text-sm font-bold text-black">
                    {getTimeAgo(user.lastLoginAt)}
                  </p>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="grid grid-cols-3 gap-px bg-black border-t-2 border-black">
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {user._count.createdFlows}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Flows Criados
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {user._count.createdCampaigns}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Campanhas
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {user._count.auditLogs}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Ações
                  </p>
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="p-4 bg-white border-t-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" strokeWidth={2} />
                    <span>Criado em {formatDate(user.createdAt)}</span>
                  </div>
                  {user.stripeCurrentPeriodEnd && (
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" strokeWidth={2} />
                      <span>
                        Assinatura até {formatDate(user.stripeCurrentPeriodEnd)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedUser(user)}
                  className="px-4 py-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold border-2 border-black transition text-sm"
                >
                  Ver Detalhes
                </button>
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
      {!loading && users.length === 0 && (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" strokeWidth={2} />
          <h3 className="text-xl font-bold text-black mb-2">
            Nenhum usuário encontrado
          </h3>
          <p className="text-gray-600">
            {search
              ? 'Tente buscar com outros termos'
              : 'Não há usuários cadastrados no sistema'}
          </p>
        </div>
      )}

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !showResetPassword && setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b-4 border-black bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-black mb-1">
                      Gerenciar Usuário
                    </h2>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setShowResetPassword(false);
                      setNewPassword('');
                    }}
                    className="p-2 hover:bg-gray-200 transition"
                  >
                    <X className="w-6 h-6" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Reset Password Section */}
                <div className="border-2 border-black p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-black" strokeWidth={2} />
                    <h3 className="font-bold text-black">Resetar Senha</h3>
                  </div>

                  {!showResetPassword ? (
                    <button
                      onClick={() => setShowResetPassword(true)}
                      className="w-full px-4 py-2 bg-[#ffeb3b] hover:bg-yellow-300 text-black font-bold border-2 border-black transition"
                    >
                      Resetar Senha do Usuário
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nova senha (mínimo 6 caracteres)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-black font-medium focus:outline-none focus:border-[#00ff88]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleResetPassword}
                          disabled={actionLoading || newPassword.length < 6}
                          className="flex-1 px-4 py-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold border-2 border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Resetando...' : 'Confirmar'}
                        </button>
                        <button
                          onClick={() => {
                            setShowResetPassword(false);
                            setNewPassword('');
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-bold border-2 border-black transition"
                        >
                          Cancelar
                        </button>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600 bg-yellow-50 border border-yellow-200 p-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-yellow-600" strokeWidth={2} />
                        <p>
                          A senha será alterada imediatamente. O usuário precisará usar a nova senha no próximo login.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Change Role Section */}
                <div className="border-2 border-black p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCog className="w-5 h-5 text-black" strokeWidth={2} />
                    <h3 className="font-bold text-black">Alterar Permissão</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-gray-700 mb-3">
                      Role atual: <span className="font-bold text-black">{selectedUser.role}</span>
                    </div>

                    {selectedUser.role === 'LOJA' ? (
                      <button
                        onClick={() => handleUpdateRole(selectedUser.id, 'ADMIN')}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-[#ff3366] hover:bg-[#dd2244] text-white font-bold border-2 border-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Crown className="w-4 h-4" strokeWidth={2} />
                        Promover para ADMIN
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateRole(selectedUser.id, 'LOJA')}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold border-2 border-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Shield className="w-4 h-4" strokeWidth={2} />
                        Rebaixar para LOJA
                      </button>
                    )}

                    <div className="flex items-start gap-2 text-xs text-gray-600 bg-red-50 border border-red-200 p-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" strokeWidth={2} />
                      <p>
                        ADMINs têm acesso total ao sistema, incluindo este painel. Use com cuidado!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
