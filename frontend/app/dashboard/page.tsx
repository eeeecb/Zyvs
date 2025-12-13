'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Zyva
          </h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user.name}! 👋
          </h2>
          <p className="text-gray-600">
            Sua conta foi criada com sucesso. Este é o seu dashboard.
          </p>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados do Usuário */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Seus Dados
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plano</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {user.plan || 'FREE'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Função</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Dados da Organização */}
          {user.organization && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sua Organização
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{user.organization.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Slug</p>
                  <p className="font-medium text-gray-900">{user.organization.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Limites</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>📊 Contatos: <span className="font-medium">{user.organization.currentContacts} / {user.organization.maxContacts}</span></p>
                    <p>⚡ Flows: <span className="font-medium">{user.organization.currentFlows} / {user.organization.maxFlows}</span></p>
                    <p>💬 Mensagens/mês: <span className="font-medium">{user.organization.messagesThisMonth} / {user.organization.maxMessagesPerMonth}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Próximos Passos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-200">
              <div className="text-3xl mb-3">👥</div>
              <h4 className="font-semibold text-gray-900 mb-2">Adicionar Contatos</h4>
              <p className="text-sm text-gray-600 mb-4">
                Importe seus contatos ou adicione manualmente
              </p>
              <button className="text-sm text-purple-600 font-medium hover:underline">
                Em breve →
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-200">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-semibold text-gray-900 mb-2">Criar Flow</h4>
              <p className="text-sm text-gray-600 mb-4">
                Automatize suas mensagens e vendas
              </p>
              <button className="text-sm text-purple-600 font-medium hover:underline">
                Em breve →
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-200">
              <div className="text-3xl mb-3">💬</div>
              <h4 className="font-semibold text-gray-900 mb-2">Conectar WhatsApp</h4>
              <p className="text-sm text-gray-600 mb-4">
                Integre sua conta do WhatsApp Business
              </p>
              <button className="text-sm text-purple-600 font-medium hover:underline">
                Em breve →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
