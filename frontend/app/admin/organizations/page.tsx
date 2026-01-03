'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  Crown,
  Calendar,
  Zap,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Plug,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  businessSegment?: string;
  isActive: boolean;
  plan: string;
  maxContacts: number;
  maxFlows: number;
  maxMessagesPerMonth: number;
  currentContacts: number;
  currentFlows: number;
  messagesThisMonth: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    plan?: string;
    stripeSubscriptionId?: string;
  };
  _count: {
    members: number;
    contacts: number;
    flows: number;
    campaigns: number;
    messages: number;
    integrations: number;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/organizations', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      setOrganizations(response.data.organizations);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const getPlanColor = (plan: string) => {
    if (plan === 'FREE') return '#94a3b8';
    if (plan.includes('TESTE')) return '#ffeb3b';
    if (plan === 'PRO') return '#00ff88';
    if (plan === 'BUSINESS') return '#00dd99';
    if (plan === 'ENTERPRISE') return '#00bb77';
    return '#gray';
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#ff3366';
    if (percentage >= 70) return '#ffeb3b';
    return '#00ff88';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-sm">Carregando organizações...</p>
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
            <Building2 className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-black">
            Gerenciar Organizações
          </h1>
        </div>
        <p className="text-gray-600 font-medium">
          Total de {pagination.total} organizações cadastradas
        </p>
      </div>

      {/* Organizations List */}
      <div className="space-y-6">
        {organizations.map((org, index) => {
          const contactsPercentage = getUsagePercentage(org.currentContacts, org.maxContacts);
          const flowsPercentage = getUsagePercentage(org.currentFlows, org.maxFlows);
          const messagesPercentage = getUsagePercentage(org.messagesThisMonth, org.maxMessagesPerMonth);

          return (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              {/* Header */}
              <div className="p-6 border-b-2 border-black">
                <div className="flex items-start justify-between gap-6">
                  {/* Org Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-16 h-16 flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: getPlanColor(org.plan) }}
                    >
                      {org.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-black">
                          {org.name}
                        </h3>
                        <div
                          className="px-2 py-1 text-xs font-bold text-black border-2 border-black"
                          style={{ backgroundColor: getPlanColor(org.plan) }}
                        >
                          {org.plan}
                        </div>
                        {org.isActive ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2} />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" strokeWidth={2} />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        /{org.slug}
                      </p>
                      {org.businessSegment && (
                        <p className="text-xs text-gray-500">
                          {org.businessSegment}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="bg-gray-50 border-2 border-black p-4 min-w-[250px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-[#ff3366]" strokeWidth={2} />
                      <span className="text-xs font-bold text-gray-600 uppercase">
                        Owner
                      </span>
                    </div>
                    <p className="text-sm font-bold text-black mb-1">
                      {org.owner.name}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" strokeWidth={2} />
                      {org.owner.email}
                    </p>
                    {org.owner.stripeSubscriptionId && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ✓ Assinatura ativa
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Limits */}
              <div className="p-6 bg-gray-50 border-b-2 border-black space-y-4">
                <h4 className="text-sm font-bold text-black uppercase mb-4">
                  Uso de Recursos
                </h4>

                {/* Contatos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">
                        Contatos
                      </span>
                    </div>
                    <span className="text-sm font-bold text-black">
                      {org.currentContacts} / {org.maxContacts}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 border border-black">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${contactsPercentage}%`,
                        backgroundColor: getUsageColor(contactsPercentage),
                      }}
                    />
                  </div>
                </div>

                {/* Flows */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-600" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">
                        Flows Ativos
                      </span>
                    </div>
                    <span className="text-sm font-bold text-black">
                      {org.currentFlows} / {org.maxFlows}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 border border-black">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${flowsPercentage}%`,
                        backgroundColor: getUsageColor(flowsPercentage),
                      }}
                    />
                  </div>
                </div>

                {/* Mensagens */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-600" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">
                        Mensagens (mês)
                      </span>
                    </div>
                    <span className="text-sm font-bold text-black">
                      {org.messagesThisMonth} / {org.maxMessagesPerMonth}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 border border-black">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${messagesPercentage}%`,
                        backgroundColor: getUsageColor(messagesPercentage),
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-black border-b-2 border-black">
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {org._count.members}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Membros
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {org._count.contacts}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Contatos
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {org._count.flows}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Flows
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {org._count.campaigns}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Campanhas
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {org._count.messages}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Mensagens
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-black">
                    {org._count.integrations}
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase flex items-center justify-center gap-1">
                    <Plug className="w-3 h-3" strokeWidth={2} />
                    APIs
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-white flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" strokeWidth={2} />
                    <span>Criado em {formatDate(org.createdAt)}</span>
                  </div>
                  {org.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" strokeWidth={2} />
                      <span>{org.email}</span>
                    </div>
                  )}
                </div>

                <button className="px-4 py-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold border-2 border-black transition text-sm">
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
      {!loading && organizations.length === 0 && (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" strokeWidth={2} />
          <h3 className="text-xl font-bold text-black mb-2">
            Nenhuma organização encontrada
          </h3>
          <p className="text-gray-600">
            Não há organizações cadastradas no sistema
          </p>
        </div>
      )}
    </div>
  );
}
